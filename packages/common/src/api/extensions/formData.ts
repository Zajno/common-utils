import type { AnyObject } from '../../types/misc.js';
import type { ApiEndpoint } from '../endpoint.js';
import type { IEndpointInfo } from '../endpoint.types.js';
import type { CallerHooks } from '../hooks.js';
import type { IRequestRawConfig } from '../call.types.js';

/**
 * Serializer function that converts a plain object into a FormData instance (or similar body).
 */
export type IFormDataSerializer = (data: Record<string, unknown>) => unknown;

/**
 * Options for the default FormData serializer factory.
 */
export interface FormDataSerializerOptions {
    /**
     * FormData constructor to use. Defaults to `globalThis.FormData`.
     *
     * Useful for:
     * - Older Node.js versions using `form-data` npm package
     * - Testing with mocks
     */
    FormData?: new () => FormData;

    /**
     * How to serialize non-primitive, non-Blob values (e.g., nested objects, arrays).
     * - `'json'` (default): `JSON.stringify(value)`
     * - Custom function: `(key, value) => string | Blob`
     */
    serializeValue?: 'json' | ((key: string, value: unknown) => string | Blob);
}

/**
 * Creates a default FormData serializer.
 *
 * Iterates over own enumerable properties of the data object and appends them to a new FormData instance.
 *
 * - `Blob`/`File` values are appended as-is
 * - `null`/`undefined` values are skipped
 * - Primitive values are converted to strings
 * - Objects/arrays are JSON-stringified by default (configurable via `serializeValue`)
 */
export function createFormDataSerializer(options?: FormDataSerializerOptions): IFormDataSerializer {
    const Ctor = options?.FormData ?? globalThis.FormData;
    const serializeValue = options?.serializeValue ?? 'json';

    return (data: Record<string, unknown>): FormData => {
        const fd = new Ctor();

        for (const [key, value] of Object.entries(data)) {
            if (value == null) {
                continue;
            }

            if (typeof Blob !== 'undefined' && value instanceof Blob) {
                fd.append(key, value);
                continue;
            }

            if (typeof value !== 'object') {
                // eslint-disable-next-line @typescript-eslint/no-base-to-string
                fd.append(key, String(value));
                continue;
            }

            if (typeof serializeValue === 'function') {
                const serialized = serializeValue(key, value);
                if (typeof Blob !== 'undefined' && serialized instanceof Blob) {
                    fd.append(key, serialized);
                } else {
                    fd.append(key, serialized as string);
                }
            } else {
                fd.append(key, JSON.stringify(value));
            }
        }

        return fd;
    };
}

/**
 * FormData serialization extension for endpoint.
 *
 * Marks an endpoint to have its request body serialized as FormData before sending.
 * Works with any HTTP transport (fetch, axios, etc.) — the library converts the plain object
 * to FormData via a configurable serializer, so the transport receives a ready-to-send FormData body.
 *
 * @example
 * ```typescript
 * const Endpoint = ApiEndpoint.create.extend(IEndpointFormData.extender);
 *
 * const upload = Endpoint('Upload')
 *     .post<{ name: string, file: File }, { url: string }>()
 *     .asFormData();
 * ```
 */
export interface IEndpointFormData {
    /** Whether this endpoint should serialize body data as FormData. `true` uses the default serializer; a function uses a custom one. */
    readonly formData?: boolean | IFormDataSerializer;

    /** Marks this endpoint to serialize request body as FormData using the provided (or default) serializer. */
    asFormData(serializer?: IFormDataSerializer): this;
}

export namespace IEndpointFormData {
    export const extender: ApiEndpoint.IBuilderExtender<IEndpointFormData> = <T extends ApiEndpoint>(base: T) => {
        const ext = {
            formData: undefined,
            asFormData(this: { formData: boolean | IFormDataSerializer }, serializer?: IFormDataSerializer) {
                this.formData = serializer ?? true;
                return this;
            },
        } as IEndpointFormData;
        return Object.assign(base, ext);
    };

    export function guard(api: IEndpointInfo): api is (IEndpointInfo & IEndpointFormData) {
        return 'formData' in api && !!(api as AnyObject).formData;
    }

    /**
     * Creates caller hooks for FormData serialization.
     *
     * The hook converts `config.data` (plain object) into a FormData instance using the provided serializer.
     *
     * @param serializer - Default serializer used when endpoint has `.asFormData()` without a custom serializer.
     *   Use {@link createFormDataSerializer} for the built-in one, or provide a fully custom function.
     *
     * @example
     * ```typescript
     * // Simplest setup (global FormData, JSON-stringify objects)
     * IEndpointFormData.createHooks(createFormDataSerializer())
     *
     * // Custom FormData constructor
     * import FormDataNode from 'form-data';
     * IEndpointFormData.createHooks(createFormDataSerializer({ FormData: FormDataNode as any }))
     *
     * // Fully custom serializer
     * IEndpointFormData.createHooks((data) => {
     *     const fd = new FormData();
     *     // custom logic...
     *     return fd;
     * })
     * ```
     */
    export function createHooks(serializer: IFormDataSerializer): CallerHooks<object> {
        return {
            beforeRequest: (config) => {
                if (!guard(config._meta.api) || !config.data) {
                    return;
                }

                const endpoint = config._meta.api;
                const ser = typeof endpoint.formData === 'function'
                    ? endpoint.formData
                    : serializer;

                (config as IRequestRawConfig<unknown>).data = ser(config.data as Record<string, unknown>);
            },
        };
    }
}
