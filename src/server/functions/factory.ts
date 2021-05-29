import { IFunctionDefinition } from '../../functions';
import { FirebaseEndpoint, EndpointFunction, EndpointContext, IFirebaseFunction } from './interface';
import { createHttpsFunction } from './create';
import { Middleware } from './middleware';

export class FunctionFactory<TArg, TResult, TContext extends { } = never>
    extends Middleware<TArg, TResult, TContext>
    implements IFirebaseFunction {

    private _endpoint: FirebaseEndpoint = null;

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
        const handler: EndpointFunction<TArg, TResult> = (data: TArg, endpointContext: EndpointContext) => this.execute(data, endpointContext);
        handler.debugName = this.Definition.CallableName;
        return handler;
    }

    public mergeContext<C extends (TContext extends never ? never : { })>(_marker?: C): FunctionFactory<TArg, TResult, Partial<TContext & C>> {
        return this;
    }
}
