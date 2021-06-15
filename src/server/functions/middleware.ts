import { EndpointContext, HandlerContext, EndpointHandler, EndpointHandlerVoid, EndpointFunction, NextFunction } from './interface';
import AppHttpError from '../utils/AppHttpError';

export interface IMiddleware<TArg, TResult, TContext extends { } = never> {
    readonly isEmpty: boolean;
    readonly currentChain: EndpointHandler<TArg, TResult, TContext>;

    use<H extends EndpointHandler<TArg, TResult, TContext>>(handler: H, name?: string): this;
    useBeforeAll<H extends EndpointHandler<TArg, TResult, TContext>>(handler: H, name?: string): this;
    useHandler<H extends EndpointHandlerVoid<TArg, TResult, TContext>>(handler: H): this;
    useFunction<F extends EndpointFunction<TArg, TResult, TContext>>(func: F): this;
    useAuth(): this;
    useContextPopulist(populist: (ctx: EndpointContext<TContext>) => Promise<void>): this;
    mergeContext<C extends (TContext extends never ? never : { })>(_marker?: C): IMiddleware<TArg, TResult, Partial<TContext & C>>;
}

export interface IMiddlewareChild<TArg, TResult, TContext extends { } = never> extends IMiddleware<TArg, TResult, TContext> {
    readonly isSkipParents: boolean;

    skipParentMiddlewares(): this;
}

export class Middleware<TArg, TResult, TContext extends { } = never> implements IMiddleware<TArg, TResult, TContext> {
    private _chain: EndpointHandler<TArg, TResult, TContext> = null;

    public get isEmpty() { return this._chain == null; }
    public get currentChain() { return this._chain; }

    constructor(other?: IMiddleware<TArg, TResult, TContext>) {
        this._chain = other ? other.currentChain : null;
    }

    public async execute(arg: TArg, endpointContext: EndpointContext<TContext>): Promise<TResult> {
        if (!this._chain) {
            throw new Error('No handlers/middleware were added');
        }

        const ctx = endpointContext as HandlerContext<TArg, TResult, TContext>;
        ctx.input = arg;
        ctx.output = null;

        await this._chain(ctx, () => Promise.resolve());

        return ctx.output;
    }

    use<H extends EndpointHandler<TArg, TResult, TContext>>(handler: H, name?: string) {
        this._chain = Middleware.add(this._chain, Middleware.safeNext(handler, name));
        return this;
    }

    useBeforeAll<H extends EndpointHandler<TArg, TResult, TContext>>(handler: H, name?: string) {
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

    mergeContext<C extends (TContext extends never ? never : { })>(_marker?: C): Middleware<TArg, TResult, Partial<TContext & C>> {
        return this;
    }
}

export class MiddlewareChild<TArg, TResult, TContext extends { } = never> extends Middleware<TArg, TResult, TContext> implements IMiddlewareChild<TArg, TResult, TContext> {
    private _skipParents = false;

    public get isSkipParents(): boolean { return this._skipParents; }

    skipParentMiddlewares(value = true): this {
        this._skipParents = value;
        return this;
    }
}

const AuthValidator: EndpointHandlerVoid<any, any, any> = async (ctx) => {
    if (!ctx?.auth?.uid) {
        throw AppHttpError.NotAuthenticated();
    }
};

export namespace Middleware {

    const EnableSafeMiddlewareNext = true;

    export function add<A, R, C = never>(h1: EndpointHandler<A, R, C>, h2: EndpointHandler<A, R, C>): EndpointHandler<A, R, C> {
        if (!h1 || !h2) {
            return combine(h1, h2);
        }

        return (ctx, next) => h1(ctx, () => h2(ctx, next));
    }

    export function combine<A, R, C = never>(...handlers: EndpointHandler<A, R, C>[]): EndpointHandler<A, R, C> {
        const hh = handlers.filter(h => !!h);
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

    export function wrapHandler<A, R, C = never>(handler: EndpointHandlerVoid<A, R, C>): EndpointHandler<A, R, C> {
        const res = async (ctx, next) => {
            await handler(ctx);
            if (next) {
                await next();
            }
        };
        res._safeNext = true;
        return res;
    }

    export function wrapFunction<A, R, C = never>(func: EndpointFunction<A, R, C>): EndpointHandler<A, R, C> {
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

    export function safeNext<A, R, C = never>(h: EndpointHandler<A, R, C>, name?: string): EndpointHandler<A, R, C> {
        if (!h) {
            throw new Error('Null argument');
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

    export function aggregate<TContext extends { } = never>(...middlewares: IMiddleware<any, any, TContext>[]): IMiddleware<any, any, TContext> {
        return new MiddlewareAggregator(middlewares);
    }
}

class MiddlewareAggregator<TContext extends { } = never> implements IMiddleware<any, any, TContext> {

    private _chain: EndpointHandler<any, any, TContext> = undefined;

    constructor(private readonly _middlewares: IMiddleware<any, any, TContext>[]) { }

    get isEmpty(): boolean { return this.currentChain != null; }
    get currentChain(): EndpointHandler<any, any, TContext> {
        if (this._chain === undefined) {
            this._chain = Middleware.combine(...this._middlewares.map(m => m.currentChain));
        }
        return this._chain;
    }

    use<H extends EndpointHandler<any, any, TContext>>(handler: H, name?: string): this {
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

    mergeContext<C extends TContext extends never ? never : {}>(_marker?: C): IMiddleware<any, any, Partial<TContext & C>> {
        return this;
    }
}
