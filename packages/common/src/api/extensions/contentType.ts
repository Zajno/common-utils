import type { ApiEndpoint, IEndpointInfo } from '../endpoint.js';

/**
 * Request Content-Type extension for endpoint.
 *
 */
export interface IEndpointInputContentType {
    /** Returns if endpoint is marked as form. */
    readonly contentType?: string;

    /** Marks this endpoint with Content-Type header to be set as 'application/x-www-form-urlencoded'. */
    asUrlEncoded(): this;

    /** Marks this endpoint with Content-Type header to be set as 'multipart/form-data'. */
    asMultipartForm(): this;

    /** Marks this endpoint with Content-Type header to be set as 'application/json'. */
    asJson(): this;

    /** Marks this endpoint with Content-Type header to be set as passed value. */
    withContentType(contentType: string): this;
}

export namespace IEndpointInputContentType {
    export const extender: ApiEndpoint.IBuilderExtender<IEndpointInputContentType> = <T extends ApiEndpoint>(base: T) => {
        const ext = {
            contentType: undefined,
            withContentType(this: { contentType: string }, contentType: string) {
                this.contentType = contentType;
                return this;
            },
            asJson(this: { contentType: string }) {
                this.contentType = 'application/json';
                return this;
            },
            asMultipartForm(this: { contentType: string }) {
                this.contentType = 'multipart/form-data';
                return this;
            },
            asUrlEncoded(this: { contentType: string }) {
                this.contentType = 'application/x-www-form-urlencoded';
                return this;
            },
        } as IEndpointInputContentType;
        return Object.assign(base, ext);
    };

    export function guard(api: IEndpointInfo): api is (IEndpointInfo & IEndpointInputContentType) {
        return 'contentType' in api;
    }

    export function tryApplyContentType(api: IEndpointInfo, headers: Record<string, string>) {
        if (guard(api) && api.contentType) {
            headers['Content-Type'] = api.contentType;
        }
    }
}
