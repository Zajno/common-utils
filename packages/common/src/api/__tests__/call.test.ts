import { Path } from '../../structures/path/index.js';
import { RequestConfigDetails, buildApiCaller } from '../call.js';
import { ApiEndpoint } from '../endpoint.js';
import { IEndpointInfo } from '../endpoint.types.js';
import { IEndpointInputContentType } from '../extensions/contentType.js';
import { IEndpointInputValidation } from '../extensions/validation.js';
import { cleanupProcessors, registerPostProcessor, registerPreProcessor } from '../register.js';

describe('api/call', () => {

    test('constructs', async () => {
        const request = vi.fn();

        type ExtraParams = { someRandomExtraField?: string };

        const caller = buildApiCaller<ExtraParams>({
            request: async <TIn, TOut>(input: RequestConfigDetails<IEndpointInfo, TIn>) => {
                request(input);
                return { status: 200, data: { input: input.data } as TOut };
            },
        });

        const endpointGet = ApiEndpoint.create().get<{ name: string }>();

        expect(endpointGet.method).toBe('GET');
        expect(endpointGet.displayName).toBeUndefined();

        await expect(caller(endpointGet, null)).resolves.toEqual({ input: undefined });

        expect(request).toHaveBeenCalledWith({
            _log: 'res',
            _noLoader: true,
            _extra: {},
            method: 'GET',
            url: '/',
            data: undefined,
            headers: {},
            _api: endpointGet,
        });
        request.mockClear();

        const endpoint = ApiEndpoint.create('Get User')
            .post<{ token?: string }, { name: string }>()
            .withPath(Path.build`/user/${'id'}`)
            .withQuery<{ full?: boolean }>('full')
            .withErrors<{ message: string }>()
            .withHeaders<{ 'x-token': string }>();

        expect(endpoint.displayName).toBe('Get User');
        expect(endpoint.method).toBe('POST');
        expect(endpoint.queryKeys).toEqual(['full']);

        await expect(caller(
            endpoint,
            { id: '123' },
            { headers: { 'x-token': '123' }, someRandomExtraField: 'extra' },
        )).resolves.toEqual({ input: undefined });

        expect(request).toHaveBeenCalledWith({
            _extra: {
                someRandomExtraField: 'extra',
            },
            _log: 'res',
            _noLoader: false,
            method: 'POST',
            url: '/user/123',
            data: undefined,
            headers: { 'x-token': '123' },
            _api: endpoint,
        });
        request.mockClear();

        await expect(caller(
            endpoint,
            { id: 312, full: true, token: 'hey' },
            { log: 'full', noLoader: true },
        )).resolves.toEqual({ input: { token: 'hey' } });

        expect(request).toHaveBeenCalledWith({
            _log: 'full',
            _extra: {},
            _noLoader: true,
            method: 'POST',
            url: '/user/312?full=true',
            data: { token: 'hey' },
            headers: {},
            _api: endpoint,
        });
        request.mockClear();


        await expect(caller(
            endpoint,
            { id: 312, full: false, token: 'hey' },
            { log: 'full', noLoader: true },
        )).resolves.toEqual({ input: { token: 'hey' } });

        expect(request).toHaveBeenCalledWith({
            _log: 'full',
            _extra: {},
            _noLoader: true,
            method: 'POST',
            url: '/user/312?full=false',
            data: { token: 'hey' },
            headers: {},
            _api: endpoint,
        });
        request.mockClear();

        const formEndpoint = ApiEndpoint.create()
            .post<{ token: string }, null>();

        const preProcessor = vi.fn(data => data);
        registerPreProcessor(formEndpoint, preProcessor);

        const postProcessor = vi.fn(data => data);
        registerPostProcessor(formEndpoint, postProcessor);

        await expect(caller(formEndpoint, { token: '123' })).resolves.toEqual({ input: { token: '123' } });
        expect(request).toHaveBeenCalledWith({
            _log: 'res',
            _extra: {},
            _noLoader: false,
            method: 'POST',
            url: '/',
            data: { token: '123' },
            headers: { },
            _api: formEndpoint,
        });
        request.mockClear();

        expect(preProcessor).toHaveBeenCalledWith({ token: '123' });
        expect(postProcessor).toHaveBeenCalledWith({ input: { token: '123' } });

        cleanupProcessors();
    });

    test('post endpoint with static path', async () => {

        const request = vi.fn();

        const caller = buildApiCaller({
            request: async <TIn, TOut>(input: RequestConfigDetails<IEndpointInfo, TIn>) => {
                request(input);
                return { status: 200, data: { input: input.data } as TOut };
            },
        });

        const base = 'api';

        const endpoint = ApiEndpoint.create()
            .post<{ email: string | null, password: string | null }, { token: string }>()
            .withPath([base, 'user']);

        await expect(caller(endpoint, { email: '123', password: '321' })).resolves.toEqual({ input: { email: '123', password: '321' } });
    });

    test('input type', () => {
        const caller = buildApiCaller({
            request: async <TIn, TOut>(input: RequestConfigDetails<IEndpointInfo, TIn>) => {
                return { status: 200, data: { input: input.data } as TOut };
            },
        });

        const endpoint = ApiEndpoint.create()
            .post<{ id: string }, { name: string }>()
            .withPath(Path.build`offers/${'id'}`);

        // TODO fix this:
        // @ ts-expect-error - id is missing
        caller(endpoint, { });

        const endpoint2 = ApiEndpoint.create()
            .post<null, string>()
            .withQuery<{ id: string }>('id');

        // type QueryType = IEndpointInfo.ExtractQuery<typeof endpoint2>;

        // TODO fix this:
        // @ ts-expect-error - id is missing when it's not optional
        caller(endpoint2, null);
        caller(endpoint2, { });

        // @ts-expect-error - id is not a string/number
        caller(endpoint2, { id: true });

        const endpoint3 = ApiEndpoint.create()
            .post<null, string>()
            .withQuery<{ id: string[], str?: string, num?: number }>('id', 'str', 'num');


        // no error here for missing optional fields
        caller(endpoint3, { id: ['123'] });
    });

    test('output type', () => {
        const caller = buildApiCaller({
            request: async <TIn, TOut>(input: RequestConfigDetails<IEndpointInfo, TIn>) => {
                return { status: 200, data: { input: input.data } as TOut };
            },
        });

        const prefix = '/user/';
        interface Result { name: string, id: number }

        const endpoint = ApiEndpoint.create()
            .get<Result>()
            .withPath(prefix, Path.build`offers/${'id'}`);

        const outEx: IEndpointInfo.ExtractOut<typeof endpoint> = { name: '123', id: 123 };
        const _callE = () => caller(endpoint, null);

        // check that caller returns the same type as the endpoint declares
        function testOut(out: IEndpointInfo.ExtractOut<typeof endpoint>) {
            return out;
        }

        const outReal: Awaited<ReturnType<typeof _callE>> = outEx;
        testOut(outReal);
    });

    test('hooks/beforeRequest | form', async () => {
        const request = vi.fn();
        const hook = vi.fn(config => {
            // clone config to test it will be correctly merged afterwards
            const result = {
                ...config,
                headers: {
                    ...config.headers,
                },
            };
            expect(config.headers).toEqual({});
            expect(result.headers).toEqual({});
            IEndpointInputContentType.tryApplyContentType(result._api, result.headers);
            expect(result.headers['Content-Type']).toBe('multipart/form-data');
            return result;
        });

        const caller = buildApiCaller({
            request: async <TIn, TOut>(input: RequestConfigDetails<IEndpointInfo, TIn>) => {
                request(input);
                return { status: 200, data: { input: input.data } as TOut };
            },
            hooks: {
                beforeRequest: hook,
            },
        });

        const endpoint = ApiEndpoint.create.extend(IEndpointInputContentType.extender)()
            .asMultipartForm()
            .post<{ id: string }, { name: string }>();

        await expect(caller(endpoint, { id: 123 })).resolves.toEqual({ input: { id: 123 } });

        expect(hook).toHaveBeenCalled();

        expect(request).toHaveBeenCalledWith({
            _log: 'res',
            _extra: {},
            _noLoader: false,
            method: 'POST',
            url: '/',
            data: { id: 123 },
            _api: endpoint,
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    });

    test('hooks/beforeConfig | validation', async () => {
        const request = vi.fn();
        const hook = vi.fn(async (api, body, path, query) => {

            expect(api).toEqual(endpoint);
            expect(body).toEqual({ id: 123 });
            expect(path).toEqual({ });
            expect(query).toEqual({ });

            await IEndpointInputValidation.tryValidate(api, body);
        });

        const validation = vi.fn((body) => {
            expect(body).toEqual({ id: 123 });
            return body;
        });

        const caller = buildApiCaller({
            request: async <TIn, TOut>(input: RequestConfigDetails<IEndpointInfo, TIn>) => {
                request(input);
                return { status: 200, data: { input: input.data } as TOut };
            },
            hooks: {
                beforeConfig: hook,
            },
        });

        const endpoint = ApiEndpoint.create.extend(IEndpointInputValidation.extender)()
            .post<{ id: string }, { name: string }>()
            .withValidation(validation);

        await expect(caller(endpoint, { id: 123 })).resolves.toEqual({ input: { id: 123 } });

        expect(hook).toHaveBeenCalled();
        expect(validation).toHaveBeenCalledWith({ id: 123 });

        expect(request).toHaveBeenCalledWith({
            _log: 'res',
            _extra: {},
            _noLoader: false,
            method: 'POST',
            url: '/',
            data: { id: 123 },
            headers: {},
            _api: endpoint,
        });

        hook.mockClear();
        request.mockClear();

        // Test validation error

        const validation2 = vi.fn((body) => {
            expect(body).toEqual({ id: 123 });
            throw new Error('Validation error');
        });

        endpoint.withValidation(validation2);

        await expect(caller(endpoint, { id: 123 })).rejects.toThrow('Validation error');

        expect(validation2).toHaveBeenCalledWith({ id: 123 });
        expect(hook).toHaveBeenCalled();
        expect(request).not.toHaveBeenCalled();
    });
});
