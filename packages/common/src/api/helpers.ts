import { Path } from '../structures/path';
import { IEndpointInfo } from './endpoint';

export const DefaultSettings = {
    templateArgPrefix: ':' satisfies Path.TemplatePrefixing,
    basePrefix: '/',
};

export function setDefaults(settings: Partial<typeof DefaultSettings>) {
    Object.assign(DefaultSettings, settings);
}

export function getPath<T extends IEndpointInfo>(endpoint: T, pathArgs?: IEndpointInfo.ExtractPath<T>) {
    if (pathArgs) {
        return endpoint.pathBuilder.build(pathArgs, { addStart: DefaultSettings.basePrefix });
    }
    return endpoint.pathBuilder.template(DefaultSettings.templateArgPrefix, { addStart: DefaultSettings.basePrefix });
}

export function getFormattedDisplayName(endpoint: IEndpointInfo) {
    const template = endpoint.pathBuilder.template(DefaultSettings.templateArgPrefix, { addStart: DefaultSettings.basePrefix });
    const prefix = endpoint.displayName
        ? `[${endpoint.displayName}] `
        : '';
    return prefix + template;
}
