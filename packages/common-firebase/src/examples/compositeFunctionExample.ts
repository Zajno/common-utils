import { createCompositionExport, FunctionComposite, spec } from '../functions/composite';
import Firebase from '../client/firebase';
import { ContextTo, EndpointContext, FunctionCompositeFactory, IFirebaseFunction, SpecTo } from '../server/functions';
import { Middleware } from '../server/functions/middleware';
import AppHttpError from '../server/utils/AppHttpError';
import { useAsyncInitLoader } from '../server/functions/loader';
import { setTimeoutAsync } from '@zajno/common/async/timeout';

export namespace ExampleEndpoint {
    const api_v1 = {
        example: spec<{ id: string }, { ok: boolean }>(),
        exampleAnon: spec<number, string>(),
        namespace: {
            nested: spec<{ lol: string }, { kek: number }>(),
            inner: {
                ['double-nested']: spec<{ in: string }, { out: string }>(),
            },
        },
        middlewaresCheck: spec<string, string>(),
    };

    export const v1 = createCompositionExport(new FunctionComposite(api_v1, 'example', 'v1'));

    const api_v2 = {
        zero: spec<string, string>(),
        n1: {
            h1: spec<string, string>(),
            n2: {
                h2: spec<string, string>(),
            },
        },
    };

    export const v2 = createCompositionExport(new FunctionComposite(api_v2, 'example', 'v2'));
}

export namespace Client {
    export async function test1(id: string) {
        const result = await Firebase.Instance.functions.create(ExampleEndpoint.v1.example)
           .execute({ id: id });

        return result.ok;
    }

    export async function test2(id: string) {
        const result = await Firebase.Instance.functions.create(ExampleEndpoint.v1.namespace.nested)
           .execute({ lol: id });

        return result.kek;
    }
}

export namespace Server {

    export namespace CommonMiddlewares {

        // custom context
        export type CurrentUserContext = { currentUser?: { id: string, name: string }};
        export namespace CurrentUserContext {
            export const Default: CurrentUserContext = null as any;

            // middleware for populating custom context
            export const Middleware = ContextTo.Populist(Default, async (ctx) => {
                if (!ctx.auth?.uid) {
                    throw AppHttpError.InvalidArguments();
                }

                ctx.data = {
                    ...ctx.data, // this allows to merge custom contexts
                    currentUser: { id: ctx.auth.uid, name: 'test' },
                };
            });
        }
    }

    export namespace SubModule {

        // define custom context for this middleware
        type Context = CommonMiddlewares.CurrentUserContext;
        const DefaultContext: Context = null as any;

        type CustomContext = { a: number };
        const DefaultCustomContext: CustomContext = null as any;

        // implementation
        const exampleFunction = SpecTo.Function(ExampleEndpoint.v1.example, async (data, ctx) => {
            if (!data?.id) {
                throw AppHttpError.InvalidArguments({ name: 'id' });
            }
            if (!ctx.data?.currentUser) {
                throw new Error('Middlewares did not run');
            }

            return { ok: data.id === ctx.data.currentUser.id };
        }, DefaultContext);

        export const exampleHandler = SpecTo.Middleware(ExampleEndpoint.v1.example, DefaultContext)
            .mergeContext(DefaultCustomContext)
            .useFunction(exampleFunction);

        export const nestedFunction = SpecTo.Function(ExampleEndpoint.v1.namespace.nested, async (data, ctx) => {
            return { kek: ('kek' + (data.lol === ctx.data?.currentUser?.name ? data.lol : 'lol')).length };
        }, DefaultContext);
    }

    export namespace ApiRoot {
        // create api root endpoint handler with global middlewares
        export const ExampleV1 = new FunctionCompositeFactory(ExampleEndpoint.v1(), CommonMiddlewares.CurrentUserContext.Default);

        // populate spec middlewares in various ways
        ExampleV1.handlers.useAuth();

        // use middlewares for all endpoints
        ExampleV1.useMiddlewaresMap({
            foo: async (_: unknown, next: any) => {
                await next();
            },
        } as any);

        ExampleV1.handlers.exampleAnon
            .skipParentMiddlewares()
            .useFunction(async (data) => `${data}`);

        Middleware.aggregate(ExampleV1.handlers.example, ExampleV1.handlers.namespace)
            .useContextPopulist(CommonMiddlewares.CurrentUserContext.Middleware);

        ExampleV1.handlers.example.use(SubModule.exampleHandler.currentChain);

        ExampleV1.handlers.namespace.nested
            .useFunction(SubModule.nestedFunction);

        ExampleV1.handlers.namespace.inner['double-nested']
            .useFunction(async (input) => ({ out: (input.in || '') + '_kek' }));

        const m0 = new Middleware<string, string, string>().use(async (ctx, next) => { ctx.data = ctx.input + '_m0'; await next(); });
        const m1 = new Middleware<string, string, string>().use(Middleware.wrapHandler(async (ctx: EndpointContext<string>) => { ctx.data = ctx.data + '_m1'; }));
        const m2 = new Middleware<string, string, string>().useFunction(async (data, ctx: EndpointContext<string>) => { return (ctx.data || data) + '_m2'; });

        ExampleV1.handlers.middlewaresCheck
            .mergeContext(null as any as string)
            .use(Middleware.aggregate(m0, m1, m2).currentChain);

        export const ExampleV2 = new FunctionCompositeFactory(ExampleEndpoint.v2(), null as any as string);

        useAsyncInitLoader(ExampleV2.asMiddleware, async () => {
            await setTimeoutAsync(50);
            return (v2) => {
                v2.handlers.useAuth();
                v2.handlers.zero.use(m2.currentChain);

                v2.handlers.n1.skipParentMiddlewares();
                v2.handlers.n1.h1.use(m2.currentChain);

                const n2Filler = SpecTo.partialEndpoint(ExampleEndpoint.v2().info.n1.n2, n2 => {
                    n2.useAuth();
                    n2.h2.use(m2.currentChain);
                });

                n2Filler(v2.handlers.n1.n2);
            };
        });
    }

    export namespace ServerRoot {
        export const ServerEndpoints = { };

        IFirebaseFunction.addTo(ServerEndpoints, true, ApiRoot.ExampleV1);
    }
}
