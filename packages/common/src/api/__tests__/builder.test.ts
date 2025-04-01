import { buildApi } from '../builder.js';
import { buildApiCaller, RequestConfigDetails } from '../call.js';
import { ApiEndpoint } from '../endpoint.js';
import { IEndpointInfo } from '../endpoint.types.js';

describe('api/builder', () => {

    test('createEndpointCallable', async () => {
        const request = vi.fn();

        type ExtraParams = { someRandomExtraField?: string };

        const callerBase = buildApiCaller<ExtraParams>({
            request: async <TIn, TOut>(input: RequestConfigDetails<IEndpointInfo, TIn>) => {
                request(input);
                return { status: 200, data: { input: input.data } as TOut };
            },
        });

        const getEndpoint = ApiEndpoint.create().get<{ name: string }>();
        const caller = buildApi(getEndpoint, callerBase);

        expect(caller).toBeTruthy();
        expect(typeof caller).toBe('function');

        const result = caller({ name: 'John' });
        await expect(result).resolves.toEqual({ input: { name: 'John' } });

        expect(request).toHaveBeenCalledWith({
            _log: 'res',
            _noLoader: true,
            _extra: {},
            method: 'GET',
            url: '/',
            data: { name: 'John' },
            headers: {},
            _api: getEndpoint,
        });
        request.mockClear();

        // test with null-ish params
        await expect((async () => {
            buildApi(null as unknown as any, callerBase);
        })).rejects.toThrowError();

        await expect((async () => {
            buildApi(getEndpoint, null as unknown as any);
        })).rejects.toThrowError();
    });

    test('buildApi', async () => {
        const request = vi.fn();

        type ExtraParams = { someRandomExtraField?: string };

        const callerBase = buildApiCaller<ExtraParams>({
            request: async <TIn, TOut>(input: RequestConfigDetails<IEndpointInfo, TIn>) => {
                request(input);
                return { status: 200, data: { input: input.data } as TOut };
            },
        });

        const Apis = { inner: ApiEndpoint.create().get<{ name: string }>() };
        const ApiCallers = buildApi(Apis, callerBase);

        expect(ApiCallers).toBeTruthy();
        expect(typeof ApiCallers).toBe('object');

        const result = ApiCallers.inner({ name: 'John' });
        await expect(result).resolves.toEqual({ input: { name: 'John' } });

        expect(request).toHaveBeenCalledWith({
            _log: 'res',
            _noLoader: true,
            _extra: {},
            method: 'GET',
            url: '/',
            data: { name: 'John' },
            headers: {},
            _api: Apis.inner,
        });
        request.mockClear();
    });

});
