import AppHttpError from '../utils/AppHttpError';
import { ArgExtract, CompositeEndpointInfo, EndpointArg, EndpointResult, FunctionComposite, ResExtract } from '../../functions/composite';
import { FunctionFactory } from './factory';
import { IMiddleware, IMiddlewareChild, Middleware, MiddlewareChild } from './middleware';
import { EndpointFunction, EndpointHandler, HandlerContext } from './interface';
import { ObjectOrPrimitive } from '@zajno/common/types/misc';

type MiddlewareMapInner<T extends CompositeEndpointInfo, TContext = any> = MiddlewaresMap<T, TContext> & IMiddlewareChild<EndpointArg<T>, EndpointResult<T>, TContext>;

export type MiddlewaresMap<T extends CompositeEndpointInfo, TContext = any> = IMiddleware<EndpointArg<T>, EndpointResult<T>, TContext> & {
    readonly [P in keyof T]: T[P] extends CompositeEndpointInfo
        ? MiddlewareMapInner<T[P], TContext>
        : IMiddlewareChild<ArgExtract<T, P>, ResExtract<T, P>, TContext>;
};

type FunctionsMap<T extends CompositeEndpointInfo, TContext = any> = {
    [P in keyof T]?: T[P] extends CompositeEndpointInfo
        ? FunctionsMap<T[P], TContext>
        : EndpointFunction<ArgExtract<T, P>, ResExtract<T, P>, TContext>;
};

export interface ICompositionMiddleware<T extends CompositeEndpointInfo, TContext = any> extends IMiddleware<EndpointArg<T>, EndpointResult<T>, TContext> {
    readonly handlers: MiddlewaresMap<T, TContext>;
}

export class FunctionCompositeFactory<T extends CompositeEndpointInfo, TContext extends ObjectOrPrimitive = any>
    extends FunctionFactory<EndpointArg<T>, EndpointResult<T>, TContext>
    implements ICompositionMiddleware<T, TContext> {

    private readonly _handlers: MiddlewaresMap<T, TContext>;
    private _handlersUsed: boolean = false;

    constructor(readonly Composition: FunctionComposite<T>, _context?: TContext, handlers?: MiddlewaresMap<T, TContext>) {
        super(Composition.rootEndpoint);

        this._handlers = FunctionCompositeFactory.cloneHandlers(handlers) ||
            this.getHandlersMap(this.Composition.info);
    }

    public get handlers(): MiddlewaresMap<T, TContext> { return this._handlers; }

    public useHandlers() {
        if (this._handlersUsed) {
            return;
        }

        this.useHandler(async (ctx: HandlerContext<EndpointArg<T>, EndpointResult<T>, TContext>) => {
            ctx.output = await this.executeMap(this.Composition.info, this._handlers, ctx, [], true);
        });
        this._handlersUsed = true;
    }

    private getHandlersMap<HT extends CompositeEndpointInfo>(info: HT) {
        const result = new MiddlewareChild<any, any, TContext>() as any as MiddlewaresMap<HT, TContext>;
        Object.keys(info).forEach((k: keyof HT) => {
            if (result[k] !== undefined) {
                throw new Error(`Field '${String(k)}' is already occupied. Probably it's reserved or duplicated.`);
            }
            result[k] = this.getHandler(info, k) as any;
        });
        return result;
    }

    private getHandler<HT extends CompositeEndpointInfo, K extends keyof HT>(info: HT, key: K): HT[keyof HT] extends CompositeEndpointInfo
        ? MiddlewaresMap<HT[keyof HT], TContext>
        : Middleware<ArgExtract<HT, keyof HT>, ResExtract<HT, keyof HT>, TContext> {

        const p = info[key];
        if (p && typeof p === 'object') {
            return this.getHandlersMap(p) as any;
        }
        return new MiddlewareChild<ArgExtract<HT, K>, ResExtract<HT, K>, TContext>() as any;
    }

    private static cloneHandlers<T extends CompositeEndpointInfo, TContext extends ObjectOrPrimitive>(handlers: MiddlewaresMap<T, TContext>): MiddlewaresMap<T, TContext> {
        if (!handlers) {
            return null;
        }

        const res = new MiddlewareChild(handlers, (handlers as any).isSkipParents || false) as any as MiddlewaresMap<T, TContext>;
        Object.keys(handlers).forEach(key => {
            const k = key as keyof T;
            if (res[k] !== undefined) {
                return;
            }
            const src = handlers[k] as any;
            res[k] = FunctionCompositeFactory.cloneHandlers(src) as any;
        });

        return res;
    }

    private async executeMap<H extends CompositeEndpointInfo>(
        info: H,
        map: MiddlewaresMap<H, TContext>,
        ctx: HandlerContext<EndpointArg<H>, EndpointResult<H>, TContext>,
        uppers: IMiddleware<any, any, TContext>[],
        strict = false,
    ) {
        const results: EndpointResult<H> = { };
        if (!ctx.input) {
            throw AppHttpError.InvalidArguments({ name: 'input', error: 'Input should not be null' });
        }
        const keys: (keyof H)[] = Object.keys(ctx.input)
            .filter(k => !!map[k]);

        if (strict && keys.length === 0) {
            throw AppHttpError.InvalidArguments();
        }

        const uppersWithThis = [...uppers, map];

        for (const key of keys) {
            const fieldInfo = info[key];
            const h = map[key];
            const input = ctx.input && ctx.input[key];
            const m = h as IMiddlewareChild<ArgExtract<H, keyof H>, ResExtract<H, keyof H>, TContext>;

            const currents = m?.isSkipParents ? [] : [...uppersWithThis];

            const executeThisKey = h && h instanceof Middleware && !h.isEmpty;
            // this can be a 'namespace' middleware or a final nested handler

            // execute inners if fieldInfo is an object
            if (fieldInfo && typeof fieldInfo === 'object') { // nested
                const innerInfo = fieldInfo as H[keyof H] & CompositeEndpointInfo;
                const innerMap = h as MiddlewaresMap<typeof innerInfo, TContext>;
                const innerInput = input as EndpointArg<typeof innerInfo>;
                const innerCtx: HandlerContext<EndpointArg<typeof innerInfo>, EndpointResult<typeof innerInfo>, TContext> = {
                    ...ctx,
                    input: innerInput,
                    output: undefined,
                };

                const innerResult = await this.executeMap(innerInfo, innerMap, innerCtx, currents);
                results[key] = innerResult as ResExtract<H, keyof H>;
            } else if (executeThisKey) {
                const final = new Middleware(Middleware.aggregate(...currents, m));

                const result = await final.execute(input, ctx);
                results[key] = result;
            } else {
                throw AppHttpError.NotFound();
            }
        }
        return results;
    }

    protected createEndpointHandler() {
        this.useHandlers();
        return super.createEndpointHandler();
    }

    protected generatedPathForInput(data: EndpointArg<T>) {
        return argumentObjectToPath(data);
    }

    public mergeContext<C extends ([TContext] extends [never] ? never : ObjectOrPrimitive)>(_marker?: C): FunctionCompositeFactory<T, Partial<TContext & C>> {
        return this as FunctionCompositeFactory<T, Partial<TContext & C>>;
    }

    public useFunctionsMap(map: FunctionsMap<T, TContext>) {
        this._useFunctionMap(this.Composition.info, map, this._handlers);
        this.useHandlers();
        return this;
    }

    public useMiddlewaresMap(map: MiddlewaresMap<T, TContext>) {
        this._useMiddlewareMap(this.Composition.info, map, this._handlers);
        this.useHandlers();
        return this;
    }

    public clone(): FunctionCompositeFactory<T, TContext> {
        return new FunctionCompositeFactory(this.Composition, null as TContext, this._handlers);
    }

    private _useFunctionMap<H extends CompositeEndpointInfo>(info: H, map: FunctionsMap<H, TContext>, handlers: MiddlewaresMap<H, TContext>) {
        const keys: (keyof H)[] = Object.keys(info);
        keys.forEach(k => {
            const m = map[k];
            if (!m) {
                return;
            }

            const fieldInfo = info[k];
            if (fieldInfo && typeof fieldInfo === 'object') {
                // nested
                const innerInfo = fieldInfo as H[keyof H] & CompositeEndpointInfo;
                const innerMap = m as FunctionsMap<typeof innerInfo, TContext>;
                const innerHandlers = handlers[k] as MiddlewaresMap<typeof innerInfo, TContext>;
                this._useFunctionMap(innerInfo, innerMap, innerHandlers);
            } else {
                // not nested
                const h = handlers[k] as IMiddleware<ArgExtract<H, keyof H>, ResExtract<H, keyof H>, TContext>;
                const f = m as EndpointFunction<ArgExtract<H, keyof H>, ResExtract<H, keyof H>, TContext>;
                h.useFunction(f);
            }
        });
    }

    private _useMiddlewareMap<H extends CompositeEndpointInfo>(info: H, map: MiddlewaresMap<H, TContext>, handlers: MiddlewaresMap<H, TContext>) {
        const keys: (keyof H)[] = Object.keys(info);
        keys.forEach(k => {
            const m = map[k];
            if (!m) {
                return;
            }

            const fieldInfo = info[k];
            if (fieldInfo && typeof fieldInfo === 'object') {
                // nested
                const innerInfo = fieldInfo as H[keyof H] & CompositeEndpointInfo;
                const innerMap = m as MiddlewaresMap<typeof innerInfo, TContext>;
                const innerHandlers = handlers[k] as MiddlewaresMap<typeof innerInfo, TContext>;
                this._useMiddlewareMap(innerInfo, innerMap, innerHandlers);
            } else {
                // not nested
                const h = handlers[k] as IMiddleware<ArgExtract<H, keyof H>, ResExtract<H, keyof H>, TContext>;
                const f = m as unknown as EndpointHandler<ArgExtract<H, keyof H>, ResExtract<H, keyof H>, TContext>;
                h.use(f);
            }
        });
    }
}

function argumentObjectToPath(obj: any): string {
    if (!obj || typeof obj !== 'object') {
        return '';
    }

    const keys = Object.keys(obj);
    if (!keys.length) {
        return '';
    }

    const parts = keys.map(key => {
        if (typeof obj[key] !== 'object') {
            return null;
        }

        const nested = argumentObjectToPath(obj[key]);
        if (nested) {
            return `${key}/${nested}`;
        }
        return key;
    }).filter(r => r);

    const res = parts.join('|');

    return parts.length > 1 ? `(${res})` : res;
}
