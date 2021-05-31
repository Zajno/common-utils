import * as Example from '../../examples/compositeFunctionExample';
import { EndpointTestContext, getNestedFunction, wrapEndpoint } from './config';

describe('Function API', () => {
    const Endpoint = wrapEndpoint(Example.Server.ApiRoot.Example);

    const ctx: EndpointTestContext = { auth: { uid: 'uid' } };

    it('just compiles LOL', () => expect(Endpoint).toBeTruthy());
    it('fails without auth', async () => {
        await expect(
            Endpoint({ example: null }, null),
        ).rejects.toThrowError('This action requires authentication');
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

    const ExampleNamespace = getNestedFunction(Endpoint, 'namespace');
    const ExampleNestedFunc = getNestedFunction(ExampleNamespace, 'nested');

    it('runs as composite – nested', async () => {
        await expect(
            ExampleNestedFunc({ lol: 'x' }, ctx)
        ).resolves.toMatchObject({ kek: 6 });
        await expect(
            ExampleNestedFunc({ lol: 'test' }, ctx)
        ).resolves.toMatchObject({ kek: 7 });
    });
});
