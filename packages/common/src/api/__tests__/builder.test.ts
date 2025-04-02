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

        const Apis = {
            inner: ApiEndpoint.create().get<{ name: string }>(),
            level2: {
                level3: ApiEndpoint.create('get name').post<{ id: string }, { name: string }>(),
            },
        };
        const ApiCallers = buildApi(Apis, callerBase);

        expect(ApiCallers).toBeTruthy();
        expect(typeof ApiCallers).toBe('object');

        // call 1
        expect(ApiCallers.inner.Endpoint).toBe(Apis.inner);
        const result1 = ApiCallers.inner({ name: 'John' });
        await expect(result1).resolves.toEqual({ input: { name: 'John' } });

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

        // call 2
        expect(ApiCallers.level2.level3.Endpoint).toBe(Apis.level2.level3);
        expect(typeof ApiCallers.level2.level3).toBe('function');

        const result2 = ApiCallers.level2.level3({ id: '123' });
        await expect(result2).resolves.toEqual({ input: { id: '123' } });

        expect(request).toHaveBeenCalledWith({
            _log: 'res',
            _noLoader: false,
            _extra: {},
            method: 'POST',
            url: '/',
            data: { id: '123' },
            headers: {},
            _api: Apis.level2.level3,
        });
        request.mockClear();
    });

});
