import type { ApiEndpoint, IEndpointInfo } from '../endpoint.js';

/**
 * Form flag extension for endpoint.
 *
 * TODO: store as content-type header?
 */
export interface IEndpointInputForm {
    /** Returns if endpoint is marked as form. */
    readonly isForm: boolean;

    /** Marks this endpoint as one has to be sent as form. */
    asForm(): this;
}

export namespace IEndpointInputForm {
    export const extender: ApiEndpoint.IBuilderExtender<IEndpointInputForm> = <T extends ApiEndpoint>(base: T) => {
        const ext = {
            isForm: false,
            asForm(this: { isForm: boolean }) {
                this.isForm = true;
                return this;
            },
        } as IEndpointInputForm;
        return Object.assign(base, ext);
    };

    export function guard(api: IEndpointInfo): api is (IEndpointInfo & IEndpointInputForm) {
        return 'isForm' in api;
    }

    export function tryApplyContentType(api: IEndpointInfo, headers: Record<string, string>) {
        if (guard(api) && api.isForm) {
            headers['Content-Type'] = 'multipart/form-data';
        }
    }
}
