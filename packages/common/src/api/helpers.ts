import { Path } from '../structures/path/index.js';
import { IEndpointInfo } from './endpoint.js';

export const DefaultSettings = {
    templateArgPrefix: ':' satisfies Path.TemplatePrefixing,
    basePrefix: '/',
};

export function setDefaults(settings: Partial<typeof DefaultSettings>) {
    Object.assign(DefaultSettings, settings);
}

type PrefixOptions = string | boolean;
const getPrefix = (prefix: PrefixOptions) => typeof prefix === 'string' ? prefix : (prefix ? DefaultSettings.basePrefix : false);

export function getPath<T extends IEndpointInfo.IPath<K>, K extends readonly string[]>(
    endpoint: T,
    pathArgs: IEndpointInfo.ExtractPath<T>,
    prefix: string | boolean = true,
) {
    const path = endpoint.path as Path.IBuilder;
    return path.build(pathArgs || undefined, { addStart: getPrefix(prefix) });
}

export function getTemplate<T extends IEndpointInfo>(endpoint: T, prefix: string | boolean = true) {
    return endpoint.path.template(DefaultSettings.templateArgPrefix, { addStart: getPrefix(prefix) });
}

export function getFormattedDisplayName(endpoint: IEndpointInfo) {
    const template = getTemplate(endpoint);
    const prefix = endpoint.displayName
        ? `[${endpoint.displayName}] `
        : '';
    return prefix + template;
}
