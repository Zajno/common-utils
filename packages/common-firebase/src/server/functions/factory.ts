import { IFunctionDefinition } from '../../functions';
import {
    EndpointFunction,
    EndpointContext,
    IFirebaseFunction,
    NextFunction,
    BaseFunctionContext,
    FirebaseEndpointRunnable,
} from './interface';
import { createHttpsCallFunction } from './create';
import { Middleware } from './middleware';
import { tryConvertToHttpError } from '../utils/LogicErrorAdapter';
import { createLogger } from '@zajno/common/logger/index';
import { badRandomString } from '@zajno/common/math/calc';
import { META_ARG_KEY, MetaHolder } from '../../functions/composite';
import { ObjectOrPrimitive } from '@zajno/common/types/misc';

export class FunctionFactory<TArg, TResult, TContext extends ObjectOrPrimitive = never>
    extends Middleware<TArg, TResult, TContext>
    implements IFirebaseFunction {

    private _endpoint: FirebaseEndpointRunnable | null = null;

    public static DefaultLogErrors: boolean = true;
    public LogErrors: boolean = FunctionFactory.DefaultLogErrors;

    constructor(
        readonly Definition: IFunctionDefinition<TArg, TResult>,
    ) {
        super();
    }

    get Endpoint() {
        if (!this._endpoint) {
            this._endpoint = createHttpsCallFunction(
                this.createEndpointHandler(),
                this.Definition.Options,
            );
        }
        return this._endpoint;
    }

    protected createEndpointHandler(): EndpointFunction<TArg, TResult> {
        const handler: EndpointFunction<TArg, TResult> = (data: TArg, ctx: BaseFunctionContext) => {

            const meta = data && (data as MetaHolder)[META_ARG_KEY];
            if (meta) {
                delete (data as MetaHolder)[META_ARG_KEY];
            }

            const path = this.generatedPathForInput(data);
            const id = badRandomString(6);

            const endpointContext: EndpointContext<TContext> = {
                ...ctx,
                endpoint: { definition: this.Definition },
                requestId: id,
                requestPath: path,
                logger: createLogger(`[API:${this.Definition.CallableName}/${path}:${id}]`),
                meta: meta,
            };

            return this.execute(data, endpointContext);
        };
        return handler;
    }

    protected generatedPathForInput(_data: TArg) {
        return '';
    }

    protected get onBeforeAll() {
        const logErrors = this.LogErrors;
        return async (ctx: EndpointContext<TContext>, next: NextFunction) => {
            // catch all errors
            try {
                await next();
            } catch (err) {
                if (logErrors) {
                    ctx.logger.error(err);
                }
                throw tryConvertToHttpError(err as Error);
            }
        };
    }

    // this overrides 'super' version because updates return type (can't use ThisType here)
    public mergeContext<C extends ([TContext] extends [never] ? never : ObjectOrPrimitive)>(
        _marker?: C
    ): FunctionFactory<TArg, TResult, Partial<TContext & C>> {
        return this as unknown as FunctionFactory<TArg, TResult, Partial<TContext & C>>;
    }
}
