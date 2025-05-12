import { transferFields } from '../fields/transfer.js';
import { Path } from '../structures/path/index.js';
import type { Mutable, Nullable } from '../types/misc.js';
import type { IEndpointInfo } from './endpoint.js';

export interface IEndpointsPathsConfig {
    /** Prefix for template args, defaults to `:` */
    readonly templateArgPrefix: Path.TemplateTransform;
    /** Base prefix for path, defaults to `/` */
    readonly basePrefix: string;
}

type PrefixOptions = string | boolean;

export class EndpointsPathsConfig implements IEndpointsPathsConfig {

    protected readonly _value: Mutable<IEndpointsPathsConfig> = {
        templateArgPrefix: ':',
        basePrefix: '/',
    };

    /** Creates a new instance of config. Follows the other instance if it's instanceof `EndpointsPathsConfig`. */
    constructor(settings?: IEndpointsPathsConfig | EndpointsPathsConfig) {
        if (settings) {
            if (settings instanceof EndpointsPathsConfig) {
                this._value = settings._value;
            } else {
                this.updateValues(settings);
            }
        }
    }

    public get templateArgPrefix(): Path.TemplateTransform { return this._value.templateArgPrefix; }
    public get basePrefix(): string { return this._value.basePrefix; }

    public expose(): IEndpointsPathsConfig {
        return {
            ...this._value,
        };
    }

    public getPath<T extends IEndpointInfo.Base & IEndpointInfo.IPathAbstract>(
        endpoint: T,
        pathArgs: IEndpointInfo.ExtractPath<T>,
        prefix: PrefixOptions = true,
    ) {
        const path = endpoint.path ?? (Path.Empty as Path.IBuilder);

        return path.build(pathArgs || undefined, { addStart: this.getPrefix(prefix) });
    }

    public getTemplate<T extends IEndpointInfo>(endpoint: T, prefix: PrefixOptions = true) {
        const path = endpoint.path ?? (Path.Empty as Path.IBuilder);

        return path.template(this.templateArgPrefix, { addStart: this.getPrefix(prefix) });
    }

    public getFormattedDisplayName(endpoint: IEndpointInfo) {
        const template = this.getTemplate(endpoint);
        const prefix = endpoint.displayName
            ? `[${endpoint.displayName}] `
            : '';
        return prefix + template;
    }

    public getEndpointsEqual(a: Nullable<IEndpointInfo>, b: Nullable<IEndpointInfo>): boolean {
        return a === b || (a == null && b == null) || (
            a != null && b != null
            && a.method === b.method
            && this.getTemplate(a) === this.getTemplate(b)
        );
    }

    private getPrefix(prefix: PrefixOptions) {
        return typeof prefix === 'string'
            ? prefix
            : (prefix ? this.basePrefix : false);
    }

    protected updateValues(settings: Partial<IEndpointsPathsConfig>) {
        transferFields.defined(
            settings,
            this._value,
            'templateArgPrefix',
            'basePrefix',
        );
    }
}

export class EndpointsPathsConfigMutable extends EndpointsPathsConfig {
    public update(settings: Partial<IEndpointsPathsConfig>) {
        this.updateValues(settings);
        return this;
    }
}

/** @deprecated Be careful with using this shared instance. Don't be lazy and create your own! */
export const DefaultSettings = new EndpointsPathsConfig();
