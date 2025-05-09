import { IEndpointInfo } from './endpoint.js';
import type {
    CallerOptions,
    CallerResponse,
    EndpointCallArgs,
    GenericApiCaller,
    RequestExtra,
} from './call.types.js';
import { EndpointsPathsConfig } from './config.js';
import { CallerHooks } from './hooks.js';
import { createConfig } from './call.config.js';

export type * from './call.types.js';

export function buildApiCaller<TExtra extends object = Record<string, any>>(options: CallerOptions<TExtra>): GenericApiCaller<TExtra> {

    const {
        request,
        config: endpointsConfigSource,
        hooks: hooksSource = {},
    } = options;

    const hooks = CallerHooks.merge(hooksSource);
    const endpointsConfig = new EndpointsPathsConfig(endpointsConfigSource);

    const caller = async function callApi<T extends IEndpointInfo>(
        api: T,
        data?: EndpointCallArgs<T> | null,
        extra?: RequestExtra<T> & TExtra,
    ) {
        type TOut = IEndpointInfo.ExtractOut<T>;

        const { config, resultInput, pathInputs, queryInputs } = createConfig(
            endpointsConfig,
            api,
            data,
            extra,
        );

        if (hooks.beforeConfig) {
            // copy all inputs to avoid mutation
            await hooks.beforeConfig(
                api,
                { ...resultInput } as IEndpointInfo.ExtractIn<T, object>,
                { ...pathInputs } as IEndpointInfo.ExtractPath<T, object>,
                { ...queryInputs } as IEndpointInfo.ExtractQuery<T, object>,
            );
        }

        if (hooks.beforeRequest) {
            const result = await hooks.beforeRequest(config);
            if (result && typeof result === 'object') {
                Object.assign(config, result);
            }
        }

        let response: CallerResponse<TOut> = await request(config);

        if (response && hooks.afterResponse) {
            response = await hooks.afterResponse(config, response) ?? response;
        }

        return response?.data;
    };

    return Object.assign(caller, {
        config: endpointsConfig,
    });
}
