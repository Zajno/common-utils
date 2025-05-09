import { Path } from '../../structures/path/index.js';
import { RequestMeta } from '../call.config.js';
import { EndpointCallArgs, IRequestConfig, buildApiCaller } from '../call.js';
import { EndpointsPathsConfig } from '../config.js';
import { ApiEndpoint } from '../endpoint.js';
import { IEndpointInfo } from '../endpoint.types.js';

describe('api/call', () => {

    test('constructs', async () => {
        const request = vi.fn();

        type ExtraParams = { someRandomExtraField?: string };

        const caller = buildApiCaller<ExtraParams>({
            request: async <TIn, TOut>(input: IRequestConfig<IEndpointInfo, TIn>) => {
                request(input);
                return { status: 200, data: { input: input.data } as TOut };
            },
        });

        {
            const endpointGet = ApiEndpoint.create()
                .get<{ name: string }>()
                .finalize();

            expect(endpointGet.method).toBe('GET');
            expect(endpointGet.displayName).toBeUndefined();

            await expect(caller(endpointGet)).resolves.toEqual({ input: undefined });

            expect(request).toHaveBeenCalledWith({
                _meta: expect.any(RequestMeta),
                method: 'GET',
                url: '/',
                data: undefined,
                headers: {},
            });
            request.mockClear();
        }

        {
            const endpointPathOnly = ApiEndpoint.create().get<{ name: string }>()
                .withPath(Path.build`${'id'}`)
                .finalize();

            caller(endpointPathOnly, { id: 123 });

            // @ts-expect-error overload with data skipped doesn't work
            caller(endpointPathOnly);

            request.mockClear();
        }

        {
            const endpointPost = ApiEndpoint.create('yo')
                .post<{ name: string }, null>()
                .finalize();

            expect(endpointPost.method).toBe('POST');
            expect(endpointPost.displayName).toBe('yo');

            await expect(caller(endpointPost, { name: 'hello' })).resolves.toEqual({ input: { name: 'hello' } });

            expect(request).toHaveBeenCalledWith({
                _meta: expect.any(RequestMeta),
                method: 'POST',
                url: '/',
                data: { name: 'hello' },
                headers: {},
            });
            request.mockClear();
        }

        {
            const endpoint = ApiEndpoint.create('Get User')
                .post<{ token?: string }, { name: string }>()
                .withPath(Path.build`/user/${'id'}`)
                .withQuery<{ full?: boolean }>('full')
                .withErrors<{ message: string }>()
                .withHeaders<{ 'x-token': string }>()
                .finalize();

            expect(endpoint.displayName).toBe('Get User');
            expect(endpoint.method).toBe('POST');
            expect(endpoint.queryKeys).toEqual(['full']);

            await expect(caller(
                endpoint,
                { id: '123' },
                { headers: { 'x-token': '123' }, someRandomExtraField: 'extra' },
            )).resolves.toEqual({ input: undefined });

            expect(request).toHaveBeenCalledWith({
                _meta: new RequestMeta(
                    endpoint,
                    new EndpointsPathsConfig(),
                    'res',
                    false,
                    { someRandomExtraField: 'extra' },
                ),
                method: 'POST',
                url: '/user/123',
                data: undefined,
                headers: { 'x-token': '123' },
            });
            request.mockClear();


            await expect(caller(
                endpoint,
                { id: 312, full: true, token: 'hey' },
                { log: 'full', noLoader: true },
            )).resolves.toEqual({ input: { token: 'hey' } });

            expect(request).toHaveBeenCalledWith({
                _meta: new RequestMeta(
                    endpoint,
                    new EndpointsPathsConfig(),
                    'full',
                    true,
                    {},
                ),
                method: 'POST',
                url: '/user/312?full=true',
                data: { token: 'hey' },
                headers: {},
            });
            request.mockClear();


            await expect(caller(
                endpoint,
                { id: 312, full: false, token: 'hey' },
                { log: 'full', noLoader: true },
            )).resolves.toEqual({ input: { token: 'hey' } });

            expect(request).toHaveBeenCalledWith({
                _meta: new RequestMeta(
                    endpoint,
                    new EndpointsPathsConfig(),
                    'full',
                    true,
                    {},
                ),
                method: 'POST',
                url: '/user/312?full=false',
                data: { token: 'hey' },
                headers: {},
            });
            request.mockClear();
        }

        const formEndpoint = ApiEndpoint.create()
            .post<{ token: string }, null>();

        await expect(caller(formEndpoint, { token: '123' })).resolves.toEqual({ input: { token: '123' } });
        expect(request).toHaveBeenCalledWith({
            _meta: new RequestMeta(
                formEndpoint,
                new EndpointsPathsConfig(),
                'res',
                false,
                {},
            ),
            method: 'POST',
            url: '/',
            data: { token: '123' },
            headers: {},
        });
        request.mockClear();
    });

    test('post endpoint with static path', async () => {

        const request = vi.fn();

        const caller = buildApiCaller({
            request: async <TIn, TOut>(input: IRequestConfig<IEndpointInfo, TIn>) => {
                request(input);
                return { status: 200, data: { input: input.data } as TOut };
            },
        });

        const base = 'api';

        const endpoint = ApiEndpoint.create()
            .post<{ email: string | null, password: string | null }, { token: string }>()
            .withPath([base, 'user'])
            .finalize();

        const args: EndpointCallArgs<typeof endpoint> = { email: '123', password: null };

        await expect(caller(endpoint, args)).resolves.toEqual({ input: args });

        expect(request).toHaveBeenCalledWith({
            _meta: expect.any(RequestMeta),
            method: 'POST',
            url: '/api/user',
            data: args,
            headers: {},
        });
    });

    test('input type', () => {
        const caller = buildApiCaller({
            request: async <TIn, TOut>(input: IRequestConfig<IEndpointInfo, TIn>) => {
                return { status: 200, data: { input: input.data } as TOut };
            },
        });

        const endpoint = ApiEndpoint.create()
            .post<null, { name: string }>()
            .withPath(Path.build`offers/${'id'}`);

        // @ts-expect-error - id is missing
        caller(endpoint, {});

        const endpoint2 = ApiEndpoint.create()
            .post<null, string>()
            .withQuery<{ id: string }>('id');

        // @ts-expect-error - id is missing when it's not optional
        caller(endpoint2, null);
        // @ts-expect-error - id is missing when it's not optional
        caller(endpoint2, {});

        // @ts-expect-error - id is not a string/number
        caller(endpoint2, { id: true });

        caller(endpoint2, { id: '123' });

        const endpoint3 = ApiEndpoint.create()
            .post<null, string>()
            .withQuery<{ id: string[], str?: string, num?: number }>('id', 'str', 'num');

        // no error here for missing optional fields
        caller(endpoint3, { id: ['123'] });

        {
            const e = ApiEndpoint.create()
                .post<{ name: string }, null>()
                .withPath(
                    Path.build`${'id'}`
                        .asOptional(),
                );

            // OK: accepts all args
            caller(e, { name: '123', id: 123 });
            // OK: accepts all but optional
            caller(e, { name: '123' });
            // @ts-expect-error ERROR: does not accept without required
            caller(e, { id: 123 });
        }
    });

    test('output type', () => {
        const caller = buildApiCaller({
            request: async <TIn, TOut>(input: IRequestConfig<IEndpointInfo, TIn>) => {
                return { status: 200, data: { input: input.data } as TOut };
            },
        });

        const prefix = '/user/';
        interface Result { name: string, id: number }

        const endpoint = ApiEndpoint.create()
            .get<Result>()
            .withPath(prefix, Path.build`offers/${'id'}`);

        const outEx: IEndpointInfo.ExtractOut<typeof endpoint> = { name: '123', id: 123 };
        const _callE = () => caller(endpoint, { id: 123 });

        // check that caller returns the same type as the endpoint declares
        function testOut(out: IEndpointInfo.ExtractOut<typeof endpoint>) {
            return out;
        }

        const outReal: Awaited<ReturnType<typeof _callE>> = outEx;
        testOut(outReal);
    });

    test('path config', async () => {
        const Config = new EndpointsPathsConfig({
            templateArgPrefix: '$',
            basePrefix: '/api/',
        });

        const request = vi.fn();
        const caller = buildApiCaller({
            request: async <TIn, TOut>(input: IRequestConfig<IEndpointInfo, TIn>) => {
                request(input);
                return { status: 200, data: { input: input.data } as TOut };
            },
            config: Config,
        });

        const endpoint = ApiEndpoint.create()
            .get<string>()
            .withPath('user/:id/status');

        await expect(caller(endpoint, { id: 123 })).resolves.toEqual({ input: undefined });

        expect(Config.getPath(endpoint, { id: 123 }, true)).toBe('/api/user/123/status');
        expect(Config.getTemplate(endpoint, true)).toBe('/api/user/$id/status');

        expect(request).toHaveBeenCalledWith({
            _meta: new RequestMeta(
                endpoint,
                new EndpointsPathsConfig({
                    templateArgPrefix: '$',
                    basePrefix: '/api/',
                }),
                'res',
                true,
                {},
            ),
            method: 'GET',
            url: '/api/user/123/status',
            data: undefined,
            headers: {},
        });
    });
});
