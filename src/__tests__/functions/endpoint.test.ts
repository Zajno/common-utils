import { FunctionCompositeFactory } from '../../server/functions';
import { createCompositionExport, FunctionComposite, spec } from '../../functions/composite';
import AppHttpError from '../../server/utils/AppHttpError';
import { getNestedFunction, wrapEndpoint } from './config';

namespace BrokenApi {
    const api1 = {
        foo: spec<number, number>(),
    };
    export const Api = createCompositionExport(new FunctionComposite(api1, 'broken'));
}

describe('declaration', () => {
    const ENDPOINT = () => new FunctionCompositeFactory(BrokenApi.Api());

    it('doesn\'t add empty', () => {
        const v1 = ENDPOINT();
        expect(() => v1.use(null)).not.toThrow();
    });

    it('adds beforeAll to empty', () => {
        const v1 = ENDPOINT();
        expect(() => v1.useBeforeAll((_ctx, next) => next())).not.toThrow();
    });

    it('called in correct order', async () => {
        let str = '';
        const v1 = wrapEndpoint(ENDPOINT()
            .use((_ctx, next) => { str += '2'; return next(); })
            .useBeforeAll((_ctx, next) => { str += '1'; return next(); })
            .useFunctionsMap({ foo: async data => data + 1 })
        );

        await expect(getNestedFunction(v1, 'foo')(1)).resolves.toEqual(2);

        expect(str).toEqual('12');
    });
});

describe('broken api', () => {

    describe('v1 – not initialized', () => {
        const mockMiddleware = jest.fn();
        const v1_endpoint = new FunctionCompositeFactory(BrokenApi.Api())
            .use((_ctx, next) => { mockMiddleware(); return next(); });

        const v1 = wrapEndpoint(v1_endpoint);
        const v1_foo = getNestedFunction(v1, 'foo');

        it('throws not found – arg is null', async () => {
            await expect(
                v1(null)
            ).rejects.toThrowError('Expected fields: input');
        });

        it('throws not found – arg is empty object', async () => {
            await expect(
                v1({ })
            ).rejects.toMatchObject(AppHttpError.InvalidArguments());
        });

        it('throws not found – arg is correct', async () => {
            await expect(
                v1_foo(1)
            ).rejects.toThrowError('Not found');
        });

        it('mock has been called', () => {
            expect(mockMiddleware).toBeCalledTimes(3);
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
