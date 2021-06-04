import { FunctionDefinition } from './definition';
import { FunctionsMemoryOptions, IFunctionDefinition } from './interface';

export type EndpointSpec<TArg, TResult> = (arg: TArg) => TResult; // can be just an empty object

export function spec<TArg, TResult>(fallback: EndpointSpec<TArg, TResult> = null): EndpointSpec<TArg, TResult> { return fallback || null; }

export type CompositeEndpointInfo = {
    [key: string]: EndpointSpec<any, any> | CompositeEndpointInfo;
};

export type ArgExtract<T, K extends keyof T> = T[K] extends EndpointSpec<infer TA, any>
    ? TA
    : (T[K] extends CompositeEndpointInfo
        ? { [P in keyof T[K]]?: ArgExtract<T[K], P> }
        : never);

export type ResExtract<T, K extends keyof T> = T[K] extends EndpointSpec<any, infer TR>
    ? TR
    : (T[K] extends CompositeEndpointInfo
        // ? { [P in keyof T[K]]?: ResExtract<T[K], P> }
        ? EndpointResult<T[K]>
        : never);

export type EndpointArg<T> = {
    [P in keyof T]?: ArgExtract<T, P>;
};

export type EndpointResult<T> = {
    [P in keyof T]?: ResExtract<T, P>;
};

export type EndpointSpecFunctions<T extends CompositeEndpointInfo> = {
    [P in keyof T]: T[P] extends CompositeEndpointInfo
        ? EndpointSpecFunctions<T[P]>
        : IFunctionDefinition<ArgExtract<T, P>, ResExtract<T, P>>;
};

export class FunctionComposite<T extends CompositeEndpointInfo> {

    /* eslint-disable proposal/class-property-no-initialized */
    private readonly _endpoint: FunctionDefinition<EndpointArg<T>, EndpointResult<T>>;
    private readonly _specs: EndpointSpecFunctions<T>;
    /* eslint-enable proposal/class-property-no-initialized */

    constructor(
        readonly info: T,
        name: string,
        namespace: string = '',
        timeout = 60,
        memory: FunctionsMemoryOptions = '256MB',
    ) {
        this._endpoint = new FunctionDefinition(name, namespace, timeout, memory);
        this._specs = specsToFunctions(info, this._endpoint);
    }

    public get rootEndpoint(): IFunctionDefinition<EndpointArg<T>, EndpointResult<T>> { return this._endpoint; }

    public get specs(): Readonly<EndpointSpecFunctions<T>> { return this._specs; }
}

function getSpec<
    T extends CompositeEndpointInfo,
    K extends keyof T,
    TArg extends ArgExtract<T, K>,
    TResult extends ResExtract<T, K>
>(
    key: K,
    endpoint: FunctionDefinition<EndpointArg<T>, EndpointResult<T>>,
): FunctionDefinition<TArg, TResult> {
    return endpoint.specify<TArg, TResult>(
        a => ({ [key]: a } as EndpointArg<T>),
        (r: EndpointResult<T>) => r[key] as TResult,
    );
}

function specsToFunctions<T extends CompositeEndpointInfo>(this: void, info: T, endpoint: FunctionDefinition<EndpointArg<T>, EndpointResult<T>>): EndpointSpecFunctions<T> {
    const result = { } as EndpointSpecFunctions<T>;
    Object.keys(info).map((k: keyof T) => {
        const p = info[k];
        const innerEndpoint = getSpec(k, endpoint);
        if (p && typeof p === 'object') { // nested composition
            const innerSpec = p as (CompositeEndpointInfo & T[keyof T]);
            result[k] = specsToFunctions(innerSpec, innerEndpoint as FunctionDefinition<EndpointArg<typeof innerSpec>, EndpointResult<typeof innerSpec>>) as any;
        } else {
            result[k] = innerEndpoint as any;
        }
    });
    return result;
}

export type CompositionExport<T extends CompositeEndpointInfo> = {
    (): FunctionComposite<T>;
} & EndpointSpecFunctions<T>;

export function createCompositionExport<T extends CompositeEndpointInfo>(definition: FunctionComposite<T>): CompositionExport<T> {
    const getter = (() => definition) as CompositionExport<T>;
    Object.assign(getter, definition.specs);
    return getter;
}
