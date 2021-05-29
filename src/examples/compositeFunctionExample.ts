import { createCompositionExport, FunctionComposite, spec } from '../functions/composite';
import Firebase from '../client/firebase';
import { ContextTo, FunctionCompositeFactory, IFirebaseFunction, SpecTo } from '../server/functions';
import AppHttpError from '../server/utils/AppHttpError';

export namespace ExampleEndpoint {
    const api_v1 = {
        example: spec<{ id: string }, { ok: boolean }>(),
    };

    export const v1 = createCompositionExport(new FunctionComposite(api_v1, 'example', 'v1'));
}

export namespace Client {
    export async function test(id: string) {
        const result = await Firebase.Instance.functions.create(ExampleEndpoint.v1.example)
           .execute({ id: id });

        return result.ok;
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
            return { ok: data.id == ctx.data.currentUser.id };
        }, null as Context);

        export const exampleHandler = SpecTo.Middleware(ExampleEndpoint.v1.example, null as Context)
            .mergeContext(null as CustomContext)
            // .useContextPopulist(CommonMiddlewares.CurrentUserContext.Middleware)
            .useFunction(exampleFunction);
    }

    export namespace ApiRoot {
        // create api root endpoint handler with global middlewares
        export const Example = new FunctionCompositeFactory(ExampleEndpoint.v1(), CommonMiddlewares.CurrentUserContext.Default)
            .useContextPopulist(CommonMiddlewares.CurrentUserContext.Middleware)
            .useAuth();

        // populate spec middlewares
        Example.handlers.example = SubModule.exampleHandler;
    }

    export namespace ServerRoot {
        export const ServerEndpoints = { };

        IFirebaseFunction.addTo(ServerEndpoints, true, ApiRoot.Example);
    }
}
