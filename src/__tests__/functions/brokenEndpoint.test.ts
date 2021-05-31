import { createCompositionExport, FunctionComposite, spec } from '../../functions/composite';
import { FunctionCompositeFactory } from '../../server/functions';
import { getNestedFunction, wrapEndpoint } from './config';

namespace BrokenApi {
    const api1 = {
        foo: spec<number, number>(),
    };
    export const Api = createCompositionExport(new FunctionComposite(api1, 'broken'));
}

describe('broken api', () => {

    describe('v1 – not initialized', () => {
        const v1 = wrapEndpoint(new FunctionCompositeFactory(BrokenApi.Api()));
        const v1_foo = getNestedFunction(v1, 'foo');

        it('throws not found – arg is null', async () => {
            await expect(
                v1(null)
            ).rejects.toThrowError('Invalid arguments');
        });

        it('throws not found – arg is correct', async () => {
            await expect(
                v1_foo(1)
            ).rejects.toThrowError('Not found');
        });
    });

    describe('v2 – now works with handler', () => {
        const v2 = wrapEndpoint(new FunctionCompositeFactory(BrokenApi.Api())
            .useFunctionsMap({
                foo: async (data) => data + 1,
            }));
        const v2_foo = getNestedFunction(v2, 'foo');

        it('correctly returns', async () => {
            await expect(
                v2_foo(1)
            ).resolves.toEqual(2);
        });
    });

    describe('v3 – empty middleware', () => {
        const v3 = wrapEndpoint(new FunctionCompositeFactory(BrokenApi.Api())
            .use(async () => { /* */ })
            .useFunctionsMap({
                foo: async (data) => data + 1,
            }),
        );
        const v3_foo = getNestedFunction(v3, 'foo');

        it('detects empty middleware', async () => {
            await expect(
                v3_foo(1)
            ).rejects.toThrowError('the middleware did not call next');
        });
    });

    describe('v4 – fixed middleware', () => {
        const v3 = wrapEndpoint(new FunctionCompositeFactory(BrokenApi.Api())
            .use((ctx, next) => {
                ++ctx.input.foo;
                return next();
            })
            .useFunctionsMap({
                foo: async (data) => data + 1,
            }),
        );
        const v3_foo = getNestedFunction(v3, 'foo');

        it('detects empty middleware', async () => {
            await expect(
                v3_foo(1)
            ).resolves.toEqual(3);
        });
    });
});
