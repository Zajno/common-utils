import * as Example from '../../examples/compositeFunctionExample';
import { EndpointTestContext, getNestedFunction, wrapEndpoint } from './config';
import { Config as RepoErrorAdapterConfig } from '../../server/utils/RepoErrorAdapter';
import AppHttpError from '../../server/utils/AppHttpError';

RepoErrorAdapterConfig.DisableErrorLogging = true;

describe('Function API', () => {
    const Endpoint = wrapEndpoint(Example.Server.ApiRoot.Example);

    const ctx: EndpointTestContext = { auth: { uid: 'uid' } };

    it('just compiles LOL', () => expect(Endpoint).toBeTruthy());
    it('fails without auth', async () => {
        await expect(
            Endpoint({ example: null }),
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
    it('runs anon', async () => {
        await expect(
            ExampleAnonFunc(123)
        ).resolves.toEqual('123');
    });

    const ExampleNamespace = getNestedFunction(Endpoint, 'namespace');
    const ExampleNestedFunc = getNestedFunction(ExampleNamespace, 'nested');
    const ExampleInner = getNestedFunction(ExampleNamespace, 'inner');
    const ExampleDoubleNested = getNestedFunction(ExampleInner, 'double-nested');

    it('applies namespace middleware (use auth)', () => expect(
        ExampleNestedFunc({ lol: 'x' }, null)
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

    it('correctly applies middlewares', () => expect(ExampleMiddlewareCheck('lol')).resolves.toEqual('lol_m0_m1_m2'));
});
