import { buildApiCaller, type IRequestConfig } from '../call.js';
import { ApiEndpoint, type IEndpointInfo } from '../endpoint.js';
import { IEndpointFormData, createFormDataSerializer } from '../extensions/formData.js';

describe('api/formData', () => {

    describe('POJO guard in createConfig', () => {
        const caller = buildApiCaller({
            request: async <TIn, TOut>(input: IRequestConfig<IEndpointInfo, TIn>) => {
                return { data: input.data as TOut };
            },
        });

        const endpoint = ApiEndpoint.create()
            .post<{ name: string }, { ok: boolean }>();

        test('accepts plain objects', async () => {
            await expect(caller(endpoint, { name: 'test' })).resolves.toEqual({ name: 'test' });
        });

        test('rejects FormData instances', async () => {
            const fd = new FormData();
            fd.append('name', 'test');

            await expect(caller(endpoint, fd as never)).rejects.toThrow(TypeError);
            await expect(caller(endpoint, fd as never)).rejects.toThrow(/non-plain object.*FormData/);
        });

        test('rejects other non-plain objects', async () => {
            class Custom { name = 'test'; }
            await expect(caller(endpoint, new Custom() as never)).rejects.toThrow(TypeError);
            await expect(caller(endpoint, new Custom() as never)).rejects.toThrow(/non-plain object.*Custom/);
        });

        test('accepts null/undefined data', async () => {
            const getEndpoint = ApiEndpoint.create().get<{ ok: boolean }>();
            await expect(caller(getEndpoint)).resolves.not.toThrow();
            await expect(caller(getEndpoint, null)).resolves.not.toThrow();
        });
    });

    describe('IEndpointFormData extension', () => {
        test('extender adds asFormData method', () => {
            const Endpoint = ApiEndpoint.create.extend(IEndpointFormData.extender);
            const ep = Endpoint('test').post<{ name: string }, null>();

            expect(typeof ep.asFormData).toBe('function');
            expect(ep.formData).toBeUndefined();

            ep.asFormData();
            expect(ep.formData).toBe(true);
        });

        test('asFormData accepts custom serializer', () => {
            const Endpoint = ApiEndpoint.create.extend(IEndpointFormData.extender);
            const customSerializer = vi.fn();
            const ep = Endpoint('test').post<{ name: string }, null>().asFormData(customSerializer);

            expect(ep.formData).toBe(customSerializer);
        });

        test('guard detects formData endpoints', () => {
            const Endpoint = ApiEndpoint.create.extend(IEndpointFormData.extender);
            const ep = Endpoint('test').post<{ name: string }, null>();

            expect(IEndpointFormData.guard(ep)).toBe(false);

            ep.asFormData();
            expect(IEndpointFormData.guard(ep)).toBe(true);
        });

    });

    describe('createFormDataSerializer', () => {
        test('creates FormData from plain object', () => {
            const serialize = createFormDataSerializer();
            const result = serialize({ name: 'test', age: 25 });

            expect(result).toBeInstanceOf(FormData);
            const fd = result as FormData;
            expect(fd.get('name')).toBe('test');
            expect(fd.get('age')).toBe('25');
        });

        test('skips null and undefined values', () => {
            const serialize = createFormDataSerializer();
            const result = serialize({ name: 'test', empty: null, missing: undefined }) as FormData;

            expect(result.get('name')).toBe('test');
            expect(result.has('empty')).toBe(false);
            expect(result.has('missing')).toBe(false);
        });

        test('JSON-stringifies objects by default', () => {
            const serialize = createFormDataSerializer();
            const nested = { key: 'value' };
            const result = serialize({ data: nested }) as FormData;

            expect(result.get('data')).toBe(JSON.stringify(nested));
        });

        test('handles Blob values', () => {
            const serialize = createFormDataSerializer();
            const blob = new Blob(['hello'], { type: 'text/plain' });
            const result = serialize({ file: blob }) as FormData;

            expect(result.get('file')).toBeInstanceOf(Blob);
        });

        test('uses custom FormData constructor', () => {
            const mockAppend = vi.fn();
            const MockFormData = vi.fn().mockImplementation(() => ({
                append: mockAppend,
            }));

            const serialize = createFormDataSerializer({ FormData: MockFormData as unknown as new () => FormData });
            serialize({ name: 'test' });

            expect(MockFormData).toHaveBeenCalled();
            expect(mockAppend).toHaveBeenCalledWith('name', 'test');
        });

        test('uses custom serialization function', () => {
            const serialize = createFormDataSerializer({
                serializeValue: (_key, value) => {
                    if (Array.isArray(value)) return value.join(',');
                    return JSON.stringify(value);
                },
            });
            const result = serialize({ tags: ['a', 'b', 'c'], meta: { x: 1 } }) as FormData;

            expect(result.get('tags')).toBe('a,b,c');
            expect(result.get('meta')).toBe('{"x":1}');
        });
    });

    describe('createHooks', () => {
        test('converts data to FormData for marked endpoints', async () => {
            const serializer = createFormDataSerializer();
            let capturedData: unknown;

            const Endpoint = ApiEndpoint.create.extend(IEndpointFormData.extender);

            const caller = buildApiCaller({
                request: async <TIn, TOut>(config: IRequestConfig<IEndpointInfo, TIn>) => {
                    capturedData = config.data;
                    return { data: null as TOut };
                },
                hooks: [
                    IEndpointFormData.createHooks(serializer),
                ],
            });

            const endpoint = Endpoint('Upload')
                .post<{ name: string, value: number }, null>()
                .asFormData();

            await caller(endpoint, { name: 'test', value: 42 });

            expect(capturedData).toBeInstanceOf(FormData);
            const fd = capturedData as FormData;
            expect(fd.get('name')).toBe('test');
            expect(fd.get('value')).toBe('42');
        });

        test('does not convert data for non-formData endpoints', async () => {
            const serializer = createFormDataSerializer();
            let capturedData: unknown;

            const caller = buildApiCaller({
                request: async <TIn, TOut>(config: IRequestConfig<IEndpointInfo, TIn>) => {
                    capturedData = config.data;
                    return { data: null as TOut };
                },
                hooks: [
                    IEndpointFormData.createHooks(serializer),
                ],
            });

            const endpoint = ApiEndpoint.create()
                .post<{ name: string }, null>();

            await caller(endpoint, { name: 'test' });

            expect(capturedData).toEqual({ name: 'test' });
            expect(capturedData).not.toBeInstanceOf(FormData);
        });

        test('uses per-endpoint custom serializer', async () => {
            const defaultSerializer = createFormDataSerializer();
            const customSerializer = vi.fn((data: Record<string, unknown>) => {
                const fd = new FormData();
                fd.append('custom', JSON.stringify(data));
                return fd;
            });

            let capturedData: unknown;

            const Endpoint = ApiEndpoint.create.extend(IEndpointFormData.extender);

            const caller = buildApiCaller({
                request: async <TIn, TOut>(config: IRequestConfig<IEndpointInfo, TIn>) => {
                    capturedData = config.data;
                    return { data: null as TOut };
                },
                hooks: [
                    IEndpointFormData.createHooks(defaultSerializer),
                ],
            });

            const endpoint = Endpoint('Custom')
                .post<{ name: string }, null>()
                .asFormData(customSerializer);

            await caller(endpoint, { name: 'test' });

            expect(customSerializer).toHaveBeenCalledWith({ name: 'test' });
            const fd = capturedData as FormData;
            expect(fd.get('custom')).toBe('{"name":"test"}');
        });

        test('works with path and query extraction', async () => {
            const { Path } = await import('../../structures/path/index.js');
            const serializer = createFormDataSerializer();
            let capturedConfig: IRequestConfig<IEndpointInfo> | undefined;

            const Endpoint = ApiEndpoint.create.extend(IEndpointFormData.extender);

            const caller = buildApiCaller({
                request: async <TIn, TOut>(config: IRequestConfig<IEndpointInfo, TIn>) => {
                    capturedConfig = config as IRequestConfig<IEndpointInfo>;
                    return { data: null as TOut };
                },
                hooks: [
                    IEndpointFormData.createHooks(serializer),
                ],
            });

            const endpoint = Endpoint('Upload')
                .post<{ name: string }, null>()
                .withPath('api/users', Path.build`${'userId'}`, 'avatar')
                .withQuery<{ format?: string }>('format')
                .asFormData();

            await caller(endpoint, { userId: '123', format: 'png', name: 'avatar' });

            expect(capturedConfig).toBeDefined();
            // Path args extracted correctly
            expect(capturedConfig!.url).toContain('/api/users/123/avatar');
            // Query args extracted correctly
            expect(capturedConfig!.url).toContain('format=png');
            // Remaining data serialized as FormData
            expect(capturedConfig!.data).toBeInstanceOf(FormData);
            const fd = capturedConfig!.data as unknown as FormData;
            expect(fd.get('name')).toBe('avatar');
            // Path and query args should NOT be in FormData
            expect(fd.has('userId')).toBe(false);
            expect(fd.has('format')).toBe(false);
        });

        test('does not convert when data is empty after extraction', async () => {
            const { Path } = await import('../../structures/path/index.js');
            const serializer = createFormDataSerializer();
            let capturedData: unknown;

            const Endpoint = ApiEndpoint.create.extend(IEndpointFormData.extender);

            const caller = buildApiCaller({
                request: async <TIn, TOut>(config: IRequestConfig<IEndpointInfo, TIn>) => {
                    capturedData = config.data;
                    return { data: null as TOut };
                },
                hooks: [
                    IEndpointFormData.createHooks(serializer),
                ],
            });

            const endpoint = Endpoint('Upload')
                .post<null, null>()
                .withPath(Path.build`${'id'}`)
                .asFormData();

            await caller(endpoint, { id: '123' });

            // All data was extracted as path args, nothing left for FormData
            expect(capturedData).toBeUndefined();
        });
    });
});
