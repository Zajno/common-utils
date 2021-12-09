import { IFunctionDefinition } from '../../functions';
import { FirebaseEndpoint, EndpointFunction, EndpointContext, IFirebaseFunction, NextFunction, BaseFunctionContext } from './interface';
import { createHttpsFunction } from './create';
import { Middleware } from './middleware';
import { tryConvertToHttpError } from '../utils/LogicErrorAdapter';
import { createLogger } from '@zajno/common/lib/logger';

export class FunctionFactory<TArg, TResult, TContext extends { } = never>
    extends Middleware<TArg, TResult, TContext>
    implements IFirebaseFunction {

    private _endpoint: FirebaseEndpoint = null;

    public static DefaultLogErrors: boolean = true;
    public LogErrors: boolean = FunctionFactory.DefaultLogErrors;

    constructor(
        readonly Definition: IFunctionDefinition<TArg, TResult>,
    ) {
        super();
    }

    get Endpoint() {
        if (!this._endpoint) {
            this._endpoint = createHttpsFunction(
                this.createEndpointHandler(),
                {
                    timeoutSeconds: this.Definition.Timeout,
                    memory: this.Definition.Memory,
                },
            );
        }
        return this._endpoint;
    }

    protected createEndpointHandler(): EndpointFunction<TArg, TResult> {
        const handler: EndpointFunction<TArg, TResult> = (data: TArg, ctx: BaseFunctionContext) => {
            const path = this.generatedPathForInput(data);
            const id = Math.random().toString(26).slice(2, 8);

            const endpointContext: EndpointContext<TContext> = {
                ...ctx,
                endpoint: { definition: this.Definition },
                requestId: id,
                requestPath: path,
                logger: createLogger(`[API:${this.Definition.CallableName}/${path}:${id}]`),
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
                throw tryConvertToHttpError(err);
            }
        };
    }

    public mergeContext<C extends (TContext extends never ? never : { })>(_marker?: C): FunctionFactory<TArg, TResult, Partial<TContext & C>> {
        return this;
    }
}
