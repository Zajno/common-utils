import { Path } from '../../structures/path/index.js';
import { buildApi, remapApisStructure } from '../builder.js';
import { RequestMeta } from '../call.config.js';
import { buildApiCaller, IRequestConfig } from '../call.js';
import { EndpointsPathsConfig } from '../config.js';
import { ApiEndpoint } from '../endpoint.js';
import { IEndpointInfo } from '../endpoint.types.js';

describe('api/builder', () => {

    test('createEndpointCallable', async () => {
        const request = vi.fn();

        type ExtraParams = { someRandomExtraField?: string };

        const callerBase = buildApiCaller<ExtraParams>({
            request: async <TIn, TOut>(input: IRequestConfig<IEndpointInfo, TIn>) => {
                request(input);
                return { status: 200, data: { input: input.data } as TOut };
            },
        });

        {
            const endpointGet = ApiEndpoint.create().get<{ name: string }>();
            const caller = buildApi(endpointGet, callerBase);

            expect(caller).toBeTruthy();
            expect(typeof caller).toBe('function');

            const result = caller();
            await expect(result).resolves.toEqual({ input: undefined });

            expect(request).toHaveBeenCalledWith({
                _meta: new RequestMeta(
                    endpointGet,
                    new EndpointsPathsConfig(),
                    'res',
                    true,
                    {},
                ),
                method: 'GET',
                url: '/',
                data: undefined,
                headers: {},
            });
            request.mockClear();
        }

        {
            const endpointPost = ApiEndpoint.create().post<{ name: string }, null>();
            const caller = buildApi(endpointPost, callerBase);

            expect(caller).toBeTruthy();
            expect(typeof caller).toBe('function');

            const result = caller({ name: 'John' });
            await expect(result).resolves.toEqual({ input: { name: 'John' } });

            expect(request).toHaveBeenCalledWith({
                _meta: expect.any(RequestMeta),
                method: 'POST',
                url: '/',
                data: { name: 'John' },
                headers: {},
            });
            request.mockClear();
        }

        // test with null-ish params
        await expect((async () => {
            buildApi(null as unknown as any, callerBase);
        })).rejects.toThrowError();

        await expect((async () => {
            buildApi(ApiEndpoint.create(), null as unknown as any);
        })).rejects.toThrowError();
    });

    test('buildApi', async () => {
        const request = vi.fn();

        type ExtraParams = { someRandomExtraField?: string };

        let lastRequestConfigCalled: IRequestConfig<IEndpointInfo, any> | null = null;
        const callerBase = buildApiCaller<ExtraParams>({
            request: async <TIn, TOut>(input: IRequestConfig<IEndpointInfo, TIn>) => {
                request(input);
                lastRequestConfigCalled = input;
                return { status: 200, data: { input: input.data } as TOut };
            },
        });

        const Apis = {
            inner: ApiEndpoint.create().post<{ name: string }, null>(),
            level2: {
                level3: ApiEndpoint.create('get name').post<{ id: string }, { name: string }>(),
            },
            types: {
                pathOnly: ApiEndpoint.create().get<{ data: number }>()
                    .withPath('test', Path.build`${'id'}`),
                queryOnly: ApiEndpoint.create().get<{ data: number }>()
                    .withPath('test')
                    .withQuery<{ id: string | number }>('id'),
                noArgs: ApiEndpoint.create().get<{ data: number }>().withPath('test'),
            },
        };
        const ApiCallers = buildApi(Apis, callerBase);

        expect(ApiCallers).toBeTruthy();
        expect(typeof ApiCallers).toBe('object');

        // call 1
        expect(ApiCallers.inner.Endpoint).toBe(Apis.inner);
        expect(ApiCallers.inner.Endpoint === Apis.inner).toBeTrue();
        const result1 = ApiCallers.inner({ name: 'John' });
        await expect(result1).resolves.toEqual({ input: { name: 'John' } });

        expect(request).toHaveBeenCalledWith({
            _meta: new RequestMeta(Apis.inner),
            method: 'POST',
            url: '/',
            data: { name: 'John' },
            headers: {},
        });

        expect(lastRequestConfigCalled).not.toBeNull();
        expect(lastRequestConfigCalled!._meta.api === Apis.inner).toBeTrue();

        lastRequestConfigCalled = null;
        request.mockClear();

        // call 2
        expect(ApiCallers.level2.level3.Endpoint).toBe(Apis.level2.level3);
        expect(ApiCallers.level2.level3.Endpoint === Apis.level2.level3).toBeTrue();
        expect(typeof ApiCallers.level2.level3).toBe('function');

        const result2 = ApiCallers.level2.level3({ id: '123' });
        await expect(result2).resolves.toEqual({ input: { id: '123' } });

        expect(request).toHaveBeenCalledWith({
            _meta: new RequestMeta(
                Apis.level2.level3,
            ),
            method: 'POST',
            url: '/',
            data: { id: '123' },
            headers: {},
        });
        request.mockClear();

        ApiCallers.types.pathOnly({ id: 123 });
        ApiCallers.types.queryOnly({ id: 123 });
        ApiCallers.types.noArgs();
    });


    test('remapApisStructure', () => {
        const Apis = {
            inner: ApiEndpoint.create().post<{ name: string }, null>(),
            level2: {
                level3: ApiEndpoint.create('get name').post<{ id: string }, { name: string }>(),
            },
            types: {
                pathOnly: ApiEndpoint.create().get<{ data: number }>()
                    .withPath('test', Path.build`${'id'}`),
                queryOnly: ApiEndpoint.create().get<{ data: number }>()
                    .withPath('test')
                    .withQuery<{ id: string | number }>('id'),
                noArgs: ApiEndpoint.create().get<{ data: number }>().withPath('test'),
            },
        };

        const remapped = remapApisStructure(Apis, api => `[${api.displayName || '?'}] ${api.path?.template(':') || '/'}`);
        expect(remapped).toEqual({
            inner: '[?] /',
            level2: {
                level3: '[get name] /',
            },
            types: {
                pathOnly: '[?] test/:id',
                queryOnly: '[?] test',
                noArgs: '[?] test',
            },
        });
    });
});
