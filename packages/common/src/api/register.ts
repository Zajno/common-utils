import { ProcessingFn, ProcessorsRegistry } from './processor';
import { getFormattedDisplayName } from './helpers';
import { ApiEndpoint, IEndpointInfo } from './endpoint';

export const PreProcessors = new ProcessorsRegistry<IEndpointInfo>();
export const PostProcessors = new ProcessorsRegistry<IEndpointInfo>();

const formatEndpointName = (api: IEndpointInfo, prefix: string, name?: string) => {
    const regName = name ? ` ||| ${name})` : '';
    return `${getFormattedDisplayName(api)}${prefix}${regName}`;
};

export function cleanupProcessors() {
    PreProcessors.cleanup();
    PostProcessors.cleanup();
}

export function registerPreProcessor<T extends IEndpointInfo>(api: T, processor: ProcessingFn<ApiEndpoint.ExtractIn<T>>, name?: string) {
    return PreProcessors.register(api, processor, formatEndpointName(api, ' | <pre_proc>', name));
}

export function registerPostProcessor<T extends IEndpointInfo>(api: T, processor: ProcessingFn<ApiEndpoint.ExtractOut<T>>, name?: string) {
    return PostProcessors.register(api, processor, formatEndpointName(api, ' | <post_proc>', name));
}
