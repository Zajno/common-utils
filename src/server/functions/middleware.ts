import { EndpointContext, HandlerContext, EndpointHandler, EndpointHandlerVoid, EndpointFunction } from './interface';
import AppHttpError from '../utils/AppHttpError';

export class Middleware<TArg, TResult, TContext extends { } = never> {
    private _chain: EndpointHandler<TArg, TResult, TContext> = null;

    public get isEmpty() { return this._chain == null; }

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

    use<H extends EndpointHandler<TArg, TResult, TContext>>(handler: H) {
        this._chain = Middleware.add(this._chain, handler);
        return this;
    }

    useBeforeAll<H extends EndpointHandler<TArg, TResult, TContext>>(handler: H) {
        this._chain = Middleware.add(handler, this._chain);
        return this;
    }

    useHandler<H extends EndpointHandlerVoid<TArg, TResult, TContext>>(handler: H) {
        return this.use(Middleware.wrapHandler(handler));
    }

    useFunction<F extends EndpointFunction<TArg, TResult, TContext>>(func: F) {
        return this.use(Middleware.wrapFunction(func));
    }

    useAuth() {
        return this.useHandler(async (ctx) => {
            if (!ctx?.auth?.uid) {
                throw AppHttpError.NotAuthenticated();
            }
        });
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

export namespace Middleware {

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

        const moveNext = async (ctx: HandlerContext<A, R, C>, index: number) => {
            if (index >= hh.length) {
                return;
            }

            await hh[index](ctx, () => moveNext(ctx, index + 1));
        };

        return (ctx) => moveNext(ctx, 0);
    }

    export function wrapHandler<A, R, C = never>(handler: EndpointHandlerVoid<A, R, C>): EndpointHandler<A, R, C> {
        return async (ctx, next) => {
            await handler(ctx);
            if (next) {
                await next();
            }
        };
    }

    export function wrapFunction<A, R, C = never>(func: EndpointFunction<A, R, C>): EndpointHandler<A, R, C> {
        return async (ctx, next) => {
            const output = await func(ctx.input, ctx);
            ctx.output = ctx.output ? Object.assign(ctx.output, output) : output;
            if (next) {
                await next();
            }
        };
    }
}
