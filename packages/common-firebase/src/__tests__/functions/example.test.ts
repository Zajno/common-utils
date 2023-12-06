import * as Example from '../../examples/compositeFunctionExample';
import { EndpointTestContext, getNestedFunction, wrapEndpoint } from './config';
import AppHttpError from '../../server/utils/AppHttpError';


describe('Function API', () => {
    const Endpoint = wrapEndpoint(Example.Server.ApiRoot.ExampleV1);

    const ctx: EndpointTestContext = { auth: { uid: 'uid' } };

    it('just compiles LOL', () => expect(Endpoint).toBeTruthy());
    it('fails with no auth', async () => {
        await expect(
            Endpoint({ example: undefined }),
        ).rejects.toThrowError(AppHttpError.DefaultStrings.unauthenticated);
    });
    it('runs as root', async () => {
        await expect(
            Endpoint({ example: { id: '123' } }, ctx),
        ).resolves.toMatchObject({ example: { ok: false } });
    });

    const ExampleFunc = getNestedFunction(Endpoint, 'example');

    it('runs as composite', async () => {
        await expect(
            ExampleFunc({ id: '123' }, ctx)
        ).resolves.toMatchObject({ ok: false });
    });

    it('runs as composite with context', async () => {
        await expect(
            ExampleFunc({ id: ctx.auth.uid }, ctx)
        ).resolves.toMatchObject({ ok: true });
    });

    const ExampleAnonFunc = getNestedFunction(Endpoint, 'exampleAnon');
    it('runs anon (skipped parent middlewares)', async () => {
        await expect(
            ExampleAnonFunc(123)
        ).resolves.toEqual('123');
    });

    const ExampleNamespace = getNestedFunction(Endpoint, 'namespace');
    const ExampleNestedFunc = getNestedFunction(ExampleNamespace, 'nested');
    const ExampleInner = getNestedFunction(ExampleNamespace, 'inner');
    const ExampleDoubleNested = getNestedFunction(ExampleInner, 'double-nested');

    it('applies namespace middleware (use auth)', () => expect(
        ExampleNestedFunc({ lol: 'x' })
    ).rejects.toThrowError(AppHttpError.DefaultStrings.unauthenticated));

    it('runs as composite – nested', async () => {
        await expect(
            ExampleNestedFunc({ lol: 'x' }, ctx)
        ).resolves.toMatchObject({ kek: 6 });
        await expect(
            ExampleNestedFunc({ lol: 'test' }, ctx)
        ).resolves.toMatchObject({ kek: 7 });
    });

    it('runs as composite – double nested', async () => {
        await expect(
            ExampleDoubleNested({ in: 'x' }, ctx)
        ).resolves.toMatchObject({ out: 'x_kek' });
    });

    const ExampleMiddlewareCheck = getNestedFunction(Endpoint, 'middlewaresCheck');

    it('correctly applies middlewares', () => expect(
        ExampleMiddlewareCheck('lol', ctx)
    ).resolves.toEqual('lol_m0_m1_m2'));

    it('contains correct context', async () => {
        const endpointDataHandler = vi.fn().mockImplementation(null);

        const endpointCopy = Example.Server.ApiRoot.ExampleV1.clone();
        endpointCopy.handlers
            .use((ctx, next) => {
                endpointDataHandler(ctx.requestPath);
                return next();
            });

        const endpoint = wrapEndpoint(endpointCopy);

        await endpoint({ example: { id: '123' } }, ctx);
        expect(endpointDataHandler).toHaveBeenCalledWith('example');
        endpointDataHandler.mockClear();

        await endpoint({ namespace: { inner: { 'double-nested': { in: 'abc' } } } }, ctx);
        expect(endpointDataHandler).toHaveBeenCalledWith('namespace/inner/double-nested');
        endpointDataHandler.mockClear();
    });

    describe('partial handlers', () => {

        const v2 = wrapEndpoint(Example.Server.ApiRoot.ExampleV2);
        describe('lvl 0', () => {
            const v2_0 = getNestedFunction(v2, 'zero');

            it('requires auth', () => expect(
                v2_0('123')
            ).rejects.toThrowError(AppHttpError.DefaultStrings.unauthenticated));

            it('results', () => expect(
                v2_0('123', ctx)
            ).resolves.toEqual('123_m2'));
        });

        const v2_n1 = getNestedFunction(v2, 'n1');
        describe('lvl 1', () => {
            const v2_h1 = getNestedFunction(v2_n1, 'h1');
            it('results (no auth)', () => expect(
                v2_h1('123')
            ).resolves.toEqual('123_m2'));
        });

        describe('lvl 2', () => {
            const v2_n2 = getNestedFunction(v2_n1, 'n2');
            const v2_h2 = getNestedFunction(v2_n2, 'h2');
            it('requires auth', () => expect(
                v2_h2('123')
            ).rejects.toThrowError(AppHttpError.DefaultStrings.unauthenticated));
            it('results', () => expect(
                v2_h2('123', ctx)
            ).resolves.toEqual('123_m2'));
        });

    });
});
