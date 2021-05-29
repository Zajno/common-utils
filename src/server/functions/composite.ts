import { createLogger, ILogger } from '@zajno/common/lib/logger';
import AppHttpError from '../utils/AppHttpError';
import { ArgExtract, CompositeEndpointInfo, EndpointArg, EndpointResult, FunctionComposite, ResExtract } from '../../functions/composite';
import { FunctionFactory } from './factory';
import { Middleware } from './middleware';
import { EndpointFunction } from './interface';

type MiddlewaresMap<T extends CompositeEndpointInfo, TContext = any> = {
    [P in keyof T]?: Middleware<ArgExtract<T, P>, ResExtract<T, P>, TContext>;
};

type FunctionsMap<T extends CompositeEndpointInfo, TContext = any> = {
    [P in keyof T]?: EndpointFunction<ArgExtract<T, P>, ResExtract<T, P>, TContext>;
};

export class FunctionCompositeFactory<T extends CompositeEndpointInfo, TContext extends { } = any>
    extends FunctionFactory<EndpointArg<T>, EndpointResult<T>, TContext> {

    private _handlers: MiddlewaresMap<T, TContext> = { };
    // eslint-disable-next-line proposal/class-property-no-initialized
    private readonly _logger: ILogger;

    constructor(readonly Composition: FunctionComposite<T>, _context?: TContext) {
        super(Composition.rootEndpoint);

        this._logger = createLogger(`[FunctionComposite:${Composition.rootEndpoint.CallableName}]`);

        Object.keys(this.Composition.info).forEach((k: keyof T) => {
            this._handlers[k] = this.getHandler(k);
        });
    }

    public get handlers(): MiddlewaresMap<T, TContext> { return this._handlers; }

    private getHandler<P extends keyof T>(_key: P) {
        return new Middleware<ArgExtract<T, P>, ResExtract<T, P>, TContext>();
    }

    protected createEndpointHandler() {
        // use it as the last
        this.useHandler(async (ctx) => {
            const results: EndpointResult<T> = { };
            const keys: (keyof T)[] = Object.keys(ctx.input)
                .filter(k => !!this._handlers[k]);
            for (const key of keys) {
                const h = this._handlers[key];
                if (h && !h.isEmpty) {
                    try {
                        const result = await h.execute(ctx.input[key], ctx);
                        results[key] = result;
                    } catch (err) {
                        this._logger.error('failed with input:', ctx.input, '\r\nERROR:', err);
                        throw err;
                    }
                } else {
                    this._logger.warn('no handler for key', key, '; input is:', ctx.input);
                    throw AppHttpError.NotFound();
                }
            }
            ctx.output = results;
        });
        return super.createEndpointHandler();
    }

    public useFunctionsMap(map: FunctionsMap<T, TContext>) {
        const keys: (keyof T)[] = Object.keys(this.Composition.specs);
        keys.forEach(k => {
            const f = map[k];
            if (!f) {
                return;
            }

            let h = this._handlers[k];
            if (!h) {
                h = this.getHandler(k);
                this._handlers[k] = h;
            }

            h.useFunction(f);
        });
        return this;
    }

    public mergeContext<C extends (TContext extends never ? never : { })>(_marker?: C): FunctionCompositeFactory<T, Partial<TContext & C>> {
        return this;
    }
}
