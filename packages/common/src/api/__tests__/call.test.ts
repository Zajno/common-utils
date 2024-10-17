import { Path } from '../../structures/path/index.js';
import { RequestConfigDetails, buildApiCaller } from '../call.js';
import { ApiEndpoint } from '../endpoint.js';
import { IEndpointInfo } from '../endpoint.types.js';
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
            bodyValidation: async () => {
                return;
            },
        });

        const getEndpoint = ApiEndpoint.get<{ name: string }>();

        await expect(caller(getEndpoint, null)).resolves.toEqual({ input: undefined });

        expect(request).toHaveBeenCalledWith({
            _log: 'res',
            _noLoader: true,
            _extra: {},
            method: 'GET',
            url: '/',
            data: undefined,
            headers: {},
            _api: getEndpoint,
        });
        request.mockClear();

        const endpoint = ApiEndpoint.post<{ token?: string }, { name: string }>('Get User')
            .withPath(Path.build`/user/${'id'}`)
            .withQuery<{ full?: boolean }>('full')
            .withErrors<{ message: string }>()
            .withHeaders<{ 'x-token': string }>();

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

        const formEndpoint = ApiEndpoint.post<{ token: string }, null>()
            .asForm();

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
            headers: { 'Content-Type': 'multipart/form-data' },
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

        const endpoint = ApiEndpoint.post<{ email: string | null, password: string | null }, { token: string }>()
            .withPath([base, 'user']);

        await expect(caller(endpoint, { email: '123', password: '321' })).resolves.toEqual({ input: { email: '123', password: '321' } });
    });

    test('input type', () => {
        const caller = buildApiCaller({
            request: async <TIn, TOut>(input: RequestConfigDetails<IEndpointInfo, TIn>) => {
                return { status: 200, data: { input: input.data } as TOut };
            },
        });

        const endpoint = ApiEndpoint.post<{ id: string }, { name: string }>()
            .withPath(Path.build`offers/${'id'}`);

        // TODO fix this:
        // @ ts-expect-error - id is missing
        caller(endpoint, { });

        const endpoint2 = ApiEndpoint.post<null, string>()
            .withQuery<{ id: string }>('id');

        // type QueryType = IEndpointInfo.ExtractQuery<typeof endpoint2>;

        // TODO fix this:
        // @ ts-expect-error - id is missing when it's not optional
        caller(endpoint2, null);
        caller(endpoint2, { });

        // @ts-expect-error - id is not a string/number
        caller(endpoint2, { id: true });

        const endpoint3 = ApiEndpoint.post<null, string>()
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

        const endpoint = ApiEndpoint.get<Result>()
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

});
