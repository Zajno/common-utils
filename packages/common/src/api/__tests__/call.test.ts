import { Path } from '../../structures/path';
import { RequestConfigDetails, buildApiCaller } from '../call';
import { ApiEndpoint, IEndpointInfo } from '../endpoint';
import { cleanupProcessors, registerPostProcessor, registerPreProcessor } from '../register';

describe('api/call', () => {

    test('constructs', async () => {
        const request = vi.fn();

        const caller = buildApiCaller({
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

        const endpoint = ApiEndpoint.post<{ token?: string }, { name: string }>('Get User')
            .withPath(Path.build`/user/${'id'}`)
            .withQuery<{ full?: boolean }>('full')
            .withErrors<{ message: string }>()
            .withHeaders<{ 'x-token': string }>();

        await expect(caller(
            endpoint,
            { id: '123' },
            { headers: { 'x-token': '123' } },
        )).resolves.toEqual({ input: {} });

        expect(request).toHaveBeenCalledWith({
            _log: 'res',
            _noLoader: false,
            method: 'POST',
            url: 'user/123',
            data: {},
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
            _noLoader: true,
            method: 'POST',
            url: 'user/312?full=true',
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
            _noLoader: false,
            method: 'POST',
            url: '',
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

        const base = 'api' as const;

        const endpoint = ApiEndpoint.post<{ email: string | null, password: string | null }, { token: string }>()
            .withPath([base, 'user']);

        await expect(caller(endpoint, { email: '123', password: '321' })).resolves.toEqual({ input: { email: '123', password: '321' } });
    });

});
