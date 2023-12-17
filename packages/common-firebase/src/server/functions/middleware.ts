import {
    EndpointContext,
    HandlerContext,
    EndpointHandler,
    EndpointHandlerVoid,
    EndpointFunction,
    NextFunction,
} from './interface';
import AppHttpError from '../utils/AppHttpError';
import { ObjectOrPrimitive } from '@zajno/common/types/misc';
import { truthy } from '@zajno/common/types/arrays';
import { assert } from '@zajno/common/functions/assert';

export interface IMiddleware<TArg, TResult, TContext extends ObjectOrPrimitive = never> {
    readonly isEmpty: boolean;
    readonly currentChain: EndpointHandler<TArg, TResult, TContext> | null;

    use<H extends EndpointHandler<TArg, TResult, TContext>>(handler: H | null, name?: string): this;

    // TODO These are helpers (syntax sugar) only, remove from interface ?
    useBeforeAll<H extends EndpointHandler<TArg, TResult, TContext>>(handler: H, name?: string): this;
    useHandler<H extends EndpointHandlerVoid<TArg, TResult, TContext>>(handler: H): this;
    useFunction<F extends EndpointFunction<TArg, TResult, TContext>>(func: F): this;
    useAuth(): this;
    useContextPopulist(populist: (ctx: EndpointContext<TContext>) => Promise<void>): this;

    mergeContext<C extends ([TContext] extends [never] ? never : ObjectOrPrimitive)>(_marker?: C): IMiddleware<TArg, TResult, Partial<TContext & C>>;
}

export interface IMiddlewareChild<TArg, TResult, TContext extends ObjectOrPrimitive = never> extends IMiddleware<TArg, TResult, TContext> {
    readonly isSkipParents: boolean;

    skipParentMiddlewares(): this;
}

export class Middleware<TArg, TResult, TContext extends ObjectOrPrimitive = never> implements IMiddleware<TArg, TResult, TContext> {
    private _chain: EndpointHandler<TArg, TResult, TContext> | null = null;
    private _chainLocked = false;

    public get isEmpty() { return this._chain == null; }
    public get currentChain() { return this._chain; }

    constructor(other?: IMiddleware<TArg, TResult, TContext>) {
        this._chain = other ? other.currentChain : null;
    }

    public async execute(arg: TArg, endpointContext: EndpointContext<TContext>): Promise<TResult | null> {
        // finally compose chain w/ hooks
        let chain = this._chain;
        this._chainLocked = true;

        try {
            // add hooks
            const beforeAll = this.onBeforeAll;
            if (beforeAll) {
                chain = Middleware.add(beforeAll, chain);
            }
            const afterAll = this.onAfterAll;
            if (afterAll) {
                chain = Middleware.add(chain, afterAll);
            }

            assert(!!chain, 'No handlers/middleware were added');

            // compose context
            const ctx = endpointContext as HandlerContext<TArg, TResult, TContext>;
            ctx.input = arg;
            ctx.output = null;

            // call compiled chain
            await chain(ctx, () => Promise.resolve());

            // assume output will be populated
            return ctx.output;
        } finally {
            this._chainLocked = false;
        }
    }

    protected get onBeforeAll(): EndpointHandler<TArg, TResult, TContext> | null { return null; }
    protected get onAfterAll(): EndpointHandler<TArg, TResult, TContext> | null { return null; }

    use<H extends EndpointHandler<TArg, TResult, TContext>>(handler: H | null, name?: string) {
        this._checkChainLocked();
        this._chain = Middleware.add(this._chain, Middleware.safeNext(handler, name));
        return this;
    }

    useBeforeAll<H extends EndpointHandler<TArg, TResult, TContext>>(handler: H, name?: string) {
        this._checkChainLocked();
        this._chain = Middleware.add(handler, Middleware.safeNext(this._chain, name));
        return this;
    }

    useHandler<H extends EndpointHandlerVoid<TArg, TResult, TContext>>(handler: H) {
        return this.use(Middleware.wrapHandler(handler));
    }

    useFunction<F extends EndpointFunction<TArg, TResult, TContext>>(func: F) {
        return this.use(Middleware.wrapFunction(func));
    }

    useAuth() {
        return this.useHandler(AuthValidator);
    }

    useContextPopulist(populist: (ctx: EndpointContext<TContext>) => Promise<void>) {
        return this.use(async (ctx, next) => {
            await populist(ctx);
            await next();
        });
    }

    mergeContext<C extends ([TContext] extends [never] ? never : ObjectOrPrimitive)>(_marker?: C) {
        return this as Middleware<TArg, TResult, Partial<TContext & C>>;
    }

    private _checkChainLocked() {
        if (this._chainLocked) {
            throw AppHttpError.Internal('Middleware chain is locked because is currently running. Updating the chain is not allowed during execution.');
        }
    }
}

export class MiddlewareChild<TArg, TResult, TContext extends ObjectOrPrimitive = never> extends Middleware<TArg, TResult, TContext> implements IMiddlewareChild<TArg, TResult, TContext> {
    private _skipParents = false;

    public get isSkipParents(): boolean { return this._skipParents; }

    constructor(other?: IMiddleware<TArg, TResult, TContext>, skipParents = false) {
        super(other);
        this._skipParents = skipParents;
    }

    skipParentMiddlewares(value = true): this {
        this._skipParents = value;
        return this;
    }
}

export const AuthValidator: EndpointHandlerVoid<any, any, any> = async (ctx) => {
    if (!ctx?.auth?.uid) {
        throw AppHttpError.NotAuthenticated();
    }
};

export namespace Middleware {

    const EnableSafeMiddlewareNext = true;

    export function add<A, R, C extends ObjectOrPrimitive = never>(h1: EndpointHandler<A, R, C> | null, h2: EndpointHandler<A, R, C> | null): EndpointHandler<A, R, C> | null {
        if (!h1 || !h2) {
            return combine(h1, h2);
        }

        return (ctx, next) => h1(ctx, () => h2(ctx, next));
    }

    export function combine<A, R, C extends ObjectOrPrimitive = never>(...handlers: (EndpointHandler<A, R, C> | null)[]): EndpointHandler<A, R, C> | null {
        const hh = handlers.filter(truthy);
        if (!hh.length) {
            return null;
        }

        if (hh.length === 1) {
            return hh[0];
        }

        const moveNext = (ctx: HandlerContext<A, R, C>, next: NextFunction, index: number) => {
            if (index >= hh.length) {
                return next();
            }

            return hh[index](ctx, () => moveNext(ctx, next, index + 1));
        };

        return (ctx, next) => moveNext(ctx, next, 0);
    }

    export function wrapHandler<A, R, C extends ObjectOrPrimitive = never>(handler: EndpointHandlerVoid<A, R, C>): EndpointHandler<A, R, C> {
        const res = async (ctx, next) => {
            await handler(ctx);
            if (next) {
                await next();
            }
        };
        res._safeNext = true;
        return res;
    }

    export function wrapFunction<A, R, C extends ObjectOrPrimitive = never>(func: EndpointFunction<A, R, C>): EndpointHandler<A, R, C> {
        const res = async (ctx, next) => {
            const output = await func(ctx.input, ctx);
            ctx.output = ctx.output ? Object.assign(ctx.output, output) : output;
            if (next) {
                await next();
            }
        };
        res._safeNext = true;
        return res;
    }

    export function safeNext<A, R, C extends ObjectOrPrimitive = never>(h: EndpointHandler<A, R, C> | null, name?: string): EndpointHandler<A, R, C> | null {
        if (!h) {
            return null;
        }

        if (!EnableSafeMiddlewareNext || (h as any)._safeNext) {
            return h;
        }

        return async (ctx, next) => {
            let calledNext = false;
            const n = async () => {
                calledNext = true;
                await next();
            };
            await h(ctx, n);
            if (!calledNext) {
                throw AppHttpError.Internal('the middleware did not call next: ' + (name || '<unknown>'));
            }
        };
    }

    export function aggregate<TContext extends ObjectOrPrimitive = never>(...middlewares: IMiddleware<any, any, TContext>[]): IMiddleware<any, any, TContext> {
        return new MiddlewareAggregator(middlewares);
    }
}

class MiddlewareAggregator<TContext extends ObjectOrPrimitive = never> implements IMiddleware<any, any, TContext> {

    private _chain: EndpointHandler<any, any, TContext> | undefined = undefined;

    constructor(private readonly _middlewares: IMiddleware<any, any, TContext>[]) { }

    get isEmpty(): boolean { return this.currentChain != null; }
    get currentChain(): EndpointHandler<any, any, TContext> {
        if (this._chain === undefined) {
            this._chain = Middleware.combine(...this._middlewares.map(m => m.currentChain))!;
        }
        return this._chain;
    }

    use<H extends EndpointHandler<any, any, TContext>>(handler: H | null, name?: string): this {
        this._middlewares.forEach(m => m.use(handler, name));
        return this;
    }

    useBeforeAll<H extends EndpointHandler<any, any, TContext>>(handler: H, name?: string): this {
        this._middlewares.forEach(m => m.useBeforeAll(handler, name));
        return this;
    }

    useHandler<H extends EndpointHandlerVoid<any, any, TContext>>(handler: H): this {
        return this.use(Middleware.wrapHandler(handler));
    }

    useFunction<F extends EndpointFunction<any, any, TContext>>(func: F): this {
        return this.use(Middleware.wrapFunction(func));
    }

    useAuth(): this {
        return this.useHandler(AuthValidator);
    }

    useContextPopulist(populist: (ctx: EndpointContext<TContext>) => Promise<void>): this {
        return this.use(async (ctx, next) => {
            await populist(ctx);
            await next();
        });
    }

    mergeContext<C extends ([TContext] extends [never] ? never : ObjectOrPrimitive)>(_marker?: C) {
        return this as IMiddleware<any, any, Partial<TContext & C>>;
    }
}
