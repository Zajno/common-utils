import * as Example from '../../examples/compositeFunctionExample';
import { EndpointTestContext, wrapEndpoint } from './config';

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
});
