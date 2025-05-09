import type { ApiEndpoint, IEndpointInfo } from '../endpoint.js';
import { CallerHooks } from '../hooks.js';

/**
 * Caller hooks on endpoint level.
 */
export interface IEndpointHooks {
    /** Endpoint hooks object, used during request. */
    readonly hooks?: CallerHooks;

    /** Adds caller hooks to this endpoint */
    withHooks(hooks: CallerHooks): this;
}

export namespace IEndpointHooks {
    export const extender: ApiEndpoint.IBuilderExtender<IEndpointHooks> = <T extends ApiEndpoint>(base: T) => {
        const ext = {
            hooks: undefined,
            withHooks(this: { hooks?: CallerHooks }, hooks: CallerHooks) {
                this.hooks = hooks;
                return this;
            },
        } as IEndpointHooks;
        return Object.assign(base, ext);
    };

    export function guard(api: IEndpointInfo): api is (IEndpointInfo & IEndpointHooks) {
        return 'hooks' in api;
    }

    export function createHooks(): CallerHooks {
        return {
            beforeConfig: (api, body, pathParams, queryParams) => {
                if (guard(api) && api.hooks?.beforeConfig) {
                    return api.hooks.beforeConfig(api, body, pathParams, queryParams);
                }
            },
            beforeRequest: (config) => {
                if (guard(config._meta.api) && config._meta.api.hooks?.beforeRequest) {
                    return config._meta.api.hooks.beforeRequest(config);
                }
            },
            afterResponse: (config, response) => {
                if (guard(config._meta.api) && config._meta.api.hooks?.afterResponse) {
                    return config._meta.api.hooks.afterResponse(config, response) as CallerHooks.HookReturnType;
                }
            },
        };
    }
}
