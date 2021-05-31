import { createLogger, ILogger } from '@zajno/common/lib/logger';
import AppHttpError from '../utils/AppHttpError';
import { ArgExtract, CompositeEndpointInfo, EndpointArg, EndpointResult, FunctionComposite, ResExtract } from '../../functions/composite';
import { FunctionFactory } from './factory';
import { Middleware } from './middleware';
import { EndpointFunction, HandlerContext } from './interface';

type MiddlewaresMap<T extends CompositeEndpointInfo, TContext = any> = {
    [P in keyof T]?: T[P] extends CompositeEndpointInfo
        ? MiddlewaresMap<T[P], TContext>
        : Middleware<ArgExtract<T, P>, ResExtract<T, P>, TContext>;
};

type FunctionsMap<T extends CompositeEndpointInfo, TContext = any> = {
    [P in keyof T]?: T[P] extends CompositeEndpointInfo
        ? FunctionsMap<T[P], TContext>
        : EndpointFunction<ArgExtract<T, P>, ResExtract<T, P>, TContext>;
};

export class FunctionCompositeFactory<T extends CompositeEndpointInfo, TContext extends { } = any>
    extends FunctionFactory<EndpointArg<T>, EndpointResult<T>, TContext> {

    // eslint-disable-next-line proposal/class-property-no-initialized
    private readonly _handlers: MiddlewaresMap<T, TContext>;
    // eslint-disable-next-line proposal/class-property-no-initialized
    private readonly _logger: ILogger;

    constructor(readonly Composition: FunctionComposite<T>, _context?: TContext) {
        super(Composition.rootEndpoint);

        this._logger = createLogger(`[FunctionComposite:${Composition.rootEndpoint.CallableName}]`);
        this._handlers = this.getHandlersMap(this.Composition.info);
    }

    public get handlers(): MiddlewaresMap<T, TContext> { return this._handlers; }

    private getHandlersMap<HT extends CompositeEndpointInfo>(info: HT) {
        const result = { } as MiddlewaresMap<HT, TContext>;
        Object.keys(info).forEach((k: keyof HT) => {
            result[k] = this.getHandler(info, k);
        });
        return result;
    }

    private getHandler<HT extends CompositeEndpointInfo, K extends keyof HT>(info: HT, key: K): HT[keyof HT] extends CompositeEndpointInfo
        ? MiddlewaresMap<HT[keyof HT], TContext>
        : Middleware<ArgExtract<HT, keyof HT>, ResExtract<HT, keyof HT>, TContext> {
        const p = info[key];
        if (p && typeof p === 'object') {
            return this.getHandlersMap(p as CompositeEndpointInfo) as any;
        }
        return new Middleware<ArgExtract<HT, K>, ResExtract<HT, K>, TContext>() as any;
    }

    private async executeMap<H extends CompositeEndpointInfo>(info: H, map: MiddlewaresMap<H, TContext>, ctx: HandlerContext<EndpointArg<H>, EndpointResult<H>, TContext>) {
        const results: EndpointResult<H> = { };
        const keys: (keyof H)[] = Object.keys(ctx.input)
            .filter(k => !!map[k]);
        for (const key of keys) {
            const fieldInfo = info[key];
            const h = map[key];

            if (fieldInfo && typeof fieldInfo === 'object') { // nested
                const innerInfo = fieldInfo as H[keyof H] & CompositeEndpointInfo;
                const innerMap = h as MiddlewaresMap<typeof innerInfo, TContext>;
                const innerInput = ctx.input[key] as EndpointArg<typeof innerInfo>;
                const innerCtx: HandlerContext<EndpointArg<typeof innerInfo>, EndpointResult<typeof innerInfo>, TContext> = {
                    ...ctx,
                    input: innerInput,
                    output: undefined,
                };

                const innerResult = await this.executeMap(innerInfo, innerMap, innerCtx);
                results[key] = innerResult as ResExtract<H, keyof H>;
            } else if (h && !h.isEmpty) {
                const m = h as Middleware<ArgExtract<H, keyof H>, ResExtract<H, keyof H>, TContext>; // Middleware<EndpointArg<H>, EndpointResult<H>, TContext>;
                try {
                    const result = await m.execute(ctx.input[key], ctx);
                    results[key] = result;
                } catch (err) {
                    this._logger.error(`failed with input: ${ctx.input[key]}\r\nERROR:`, err);
                    throw err;
                }
            } else {
                this._logger.warn('no handler for key', key, '; input is:', ctx.input);
                throw AppHttpError.NotFound();
            }
        }
        return results;
    }

    protected createEndpointHandler() {
        // use it as the last
        this.useHandler(async (ctx) => {
            ctx.output = await this.executeMap(this.Composition.info, this._handlers, ctx);
        });
        return super.createEndpointHandler();
    }

    public mergeContext<C extends (TContext extends never ? never : { })>(_marker?: C): FunctionCompositeFactory<T, Partial<TContext & C>> {
        return this;
    }

    public useFunctionsMap(map: FunctionsMap<T, TContext>) {
        this._useFunctionMap(this.Composition.info, map, this._handlers);
        return this;
    }

    private _useFunctionMap<H extends CompositeEndpointInfo>(info: H, map: FunctionsMap<H, TContext>, handlers: MiddlewaresMap<H, TContext>) {
        const keys: (keyof H)[] = Object.keys(info);
        keys.forEach(k => {
            const m = map[k];
            if (!m) {
                return;
            }

            const fieldInfo = info[k];
            if (typeof fieldInfo === 'object') {
                // nested
                const innerInfo = fieldInfo as H[keyof H] & CompositeEndpointInfo;
                const innerMap = m as FunctionsMap<typeof innerInfo, TContext>;
                const innerHandlers = handlers[k] as MiddlewaresMap<typeof innerInfo, TContext>;
                this._useFunctionMap(innerInfo, innerMap, innerHandlers);
            } else {
                // not nested
                const h = handlers[k] as Middleware<ArgExtract<H, keyof H>, ResExtract<H, keyof H>, TContext>;
                const f = m as EndpointFunction<ArgExtract<H, keyof H>, ResExtract<H, keyof H>, TContext>;
                h.useFunction(f);
            }
        });
    }

}
