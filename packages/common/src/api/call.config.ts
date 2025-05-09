import { AnyObject } from '../types/misc.js';
import type { EndpointCallArgs, IRequestConfig, IRequestMeta, RequestExtra } from './call.types.js';
import { EndpointsPathsConfig } from './config.js';
import type { IEndpointInfo } from './endpoint.types.js';
import type { LogTypes } from './logging.js';

export function createConfig<T extends IEndpointInfo, TExtra extends object = Record<string, any>>(
    endpointsConfig: EndpointsPathsConfig,
    api: T,
    data?: EndpointCallArgs<T> | null,
    extra?: RequestExtra<T> & TExtra,
) {

    type TIn = IEndpointInfo.ExtractIn<T, object>;

    const {
        headers,
        log = 'res',
        noLoader,
        ...restExtra
    } = extra || {};

    const resultInput = data && { ...data };
    const pathInputs: Record<string, string | number> = {};
    const queryInputs: AnyObject = {};
    let queryStr: string = '';

    // extract path inputs from data
    const pathKeys = api.path?.args;
    if (resultInput && pathKeys?.length) {
        for (const key of pathKeys) {
            pathInputs[key] = resultInput[key];
            delete resultInput[key];
        }
    }

    // extract query inputs from data
    const queryKeysExpected = api.queryKeys;
    if (resultInput && queryKeysExpected?.length) {
        let empty = true;
        for (const key of queryKeysExpected) {
            const v = resultInput[key];
            if (v != null) {
                queryInputs[key] = v;
                empty = false;
            }
            delete resultInput[key];
        }

        // compile query string
        if (!empty) {
            const params = new URLSearchParams(queryInputs);
            queryStr = '?' + params.toString();
        }
    }

    const sendingData = resultInput && Object.keys(resultInput).length > 0
        ? resultInput
        : undefined;

    const method = api.method || 'GET';
    const config: IRequestConfig<T, TIn, TExtra> = {
        method,
        url: endpointsConfig.getPath(api, pathInputs as IEndpointInfo.ExtractPath<T>) + queryStr,
        data: sendingData || undefined,
        headers: headers as AnyObject || {},

        _meta: new RequestMeta<T, TExtra>(
            api,
            endpointsConfig,
            log,
            noLoader ?? method as string === 'GET',
            restExtra as TExtra,
        ),
    };

    return {
        config,
        resultInput,
        pathInputs,
        queryInputs,
    };
}

/**
 * Request meta wrapped in a class for:
 *
 * - not being a plain object
 * - being able to extend it in the future with helpful methods
 */
export class RequestMeta<T extends IEndpointInfo, TExtra extends object = Record<string, any>> implements IRequestMeta<T, TExtra> {
    constructor(
        public readonly api: T,
        public readonly pathsConfig: EndpointsPathsConfig = new EndpointsPathsConfig(),
        public readonly log: LogTypes = 'res',
        public readonly noLoader: boolean = false,
        public readonly extra: TExtra = {} as RequestExtra<T> & TExtra,
    ) {

    }
}
