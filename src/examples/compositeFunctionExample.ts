import { createCompositionExport, FunctionComposite, spec } from '../functions/composite';
import Firebase from '../client/firebase';
import { ContextTo, EndpointContext, FunctionCompositeFactory, IFirebaseFunction, SpecTo } from '../server/functions';
import { Middleware } from '../server/functions/middleware';
import AppHttpError from '../server/utils/AppHttpError';

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
            export const Default: CurrentUserContext = null;

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

        type CustomContext = { a: number };

        // implementation
        const exampleFunction = SpecTo.Function(ExampleEndpoint.v1.example, async (data, ctx) => {
            if (!data?.id) {
                throw AppHttpError.InvalidArguments();
            }
            if (!ctx.data?.currentUser) {
                throw new Error('Middlewares did not run');
            }

            return { ok: data.id === ctx.data.currentUser.id };
        }, null as Context);

        export const exampleHandler = SpecTo.Middleware(ExampleEndpoint.v1.example, null as Context)
            .mergeContext(null as CustomContext)
            .useFunction(exampleFunction);

        export const nestedFunction = SpecTo.Function(ExampleEndpoint.v1.namespace.nested, async (data, ctx) => {
            return { kek: ('kek' + (data.lol === ctx.data.currentUser.name ? data.lol : 'lol')).length };
        }, null as Context);
    }

    export namespace ApiRoot {
        // create api root endpoint handler with global middlewares
        export const Example = new FunctionCompositeFactory(ExampleEndpoint.v1(), CommonMiddlewares.CurrentUserContext.Default);

        // populate spec middlewares in various ways
        Example.handlers.exampleAnon.useFunction(async (data) => `${data}`);

        Middleware.aggregate(Example.handlers.example, Example.handlers.namespace)
            .useAuth()
            .useContextPopulist(CommonMiddlewares.CurrentUserContext.Middleware);

        Example.handlers.example.use(SubModule.exampleHandler.currentChain);

        Example.handlers.namespace.nested
            .useFunction(SubModule.nestedFunction);

        Example.handlers.namespace.inner['double-nested']
            .useFunction(async (input) => ({ out: (input.in || '') + '_kek' }));

        const m0 = new Middleware<string, string, string>().use(async (ctx, next) => { ctx.data = ctx.input + '_m0'; await next(); });
        const m1 = new Middleware<string, string, string>().use(Middleware.wrapHandler(async (ctx: EndpointContext<string>) => { ctx.data = ctx.data + '_m1'; }));
        const m2 = new Middleware<string, string, string>().useFunction(async (_data, ctx: EndpointContext<string>) => { return ctx.data + '_m2'; });

        Example.handlers.middlewaresCheck
            .mergeContext(null as string)
            .use(Middleware.aggregate(m0, m1, m2).currentChain);
    }

    export namespace ServerRoot {
        export const ServerEndpoints = { };

        IFirebaseFunction.addTo(ServerEndpoints, true, ApiRoot.Example);
    }
}
