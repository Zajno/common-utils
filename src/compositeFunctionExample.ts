import { createCompositionExport, FunctionComposite, spec } from './functions/composite';
import Firebase from './client/firebase';
import { FunctionCompositeFactory, endpointHandler } from './server/functions';

export namespace ExampleEndpoint {
    export const v1 = createCompositionExport(new FunctionComposite({
        example: spec<{ id: string }, { ok: boolean }>(),
    }, 'example', 'api'));
}

export namespace Client {
    export async function test(id: string) {
        const result = await Firebase.Instance.functions.create(ExampleEndpoint.v1.example)
           .execute({ id: id });

        return result.ok;
    }
}

export namespace Server {
    export const ServerEndpoints = { };

    const exampleHandler = endpointHandler(ExampleEndpoint.v1.example, async (data, ctx) => {
        return { ok: ctx.auth.uid != null && data.id != null };
    });

    export const Example = new FunctionCompositeFactory(ExampleEndpoint.v1())
        .addHandler('example', exampleHandler)
        .addAuthFunctionTo(ServerEndpoints);
}
