/* eslint-disable proposal/class-property-no-initialized */
import * as functions from 'firebase-functions';
import * as RepoErrorAdapter from './utils/RepoErrorAdapter';
import { IFunctionDefinition } from '../functions';
import { ArgExtract, CompositeEndpointInfo, EndpointArg, EndpointResult, FunctionComposite, ResExtract } from '../functions/composite';
import { createLogger, ILogger } from '@zajno/common/lib/logger';
import AppHttpError from './utils/AppHttpError';

export type FirebaseFunctionCall<T, TOut> = { debugName?: string } & ((data: T, context: functions.https.CallableContext) => Promise<TOut>);

function filterRequestMethod<T, TOut>(handler: FirebaseFunctionCall<T, TOut>): FirebaseFunctionCall<T, TOut> {
    return (data, ctx) => {
        if (ctx?.rawRequest && ctx.rawRequest.method !== 'POST') {
            return Promise.resolve({} as TOut);
        }
        return handler(data, ctx);
    };
}

export function createFunction<T = any, TOut = void>(worker: FirebaseFunctionCall<T, TOut>, options: functions.RuntimeOptions = null) {
    const builder = options
        ? functions.runWith(options)
        : functions;

    return builder.https.onCall(
        filterRequestMethod(
            RepoErrorAdapter.wrapRepoError(worker, worker.debugName),
        ),
    );
}

export function createAuthFunction<T = any, TOut = void>(worker: FirebaseFunctionCall<T, TOut>, options: functions.RuntimeOptions = null) {
    const workerWrap: FirebaseFunctionCall<T, TOut> = (data: T, ctx: functions.https.CallableContext) => {
        if (!ctx.auth || !ctx.auth.uid) {
            throw new functions.https.HttpsError('unauthenticated', 'User needs to be authenticated.');
        }

        return worker(data, ctx);
    };

    return createFunction(workerWrap, options);
}

type FunctionWorker = ReturnType<typeof createFunction>;
type AuthFunctionWorker = ReturnType<typeof createAuthFunction>;

export interface IFunction<TArg, TResult, TWorker extends FirebaseFunctionCall<TArg, TResult> = FirebaseFunctionCall<TArg, TResult>> {
    readonly Worker: TWorker;
    readonly Function: FunctionWorker;
    readonly AuthFunction: AuthFunctionWorker;
}

export class FunctionFactory<TArg, TResult, TWorker extends FirebaseFunctionCall<TArg, TResult> = FirebaseFunctionCall<TArg, TResult>>
    implements IFunction<TArg, TResult, TWorker> {

    private _worker: TWorker;

    private _func: FunctionWorker;
    private _authFunc: AuthFunctionWorker;

    private _options: functions.RuntimeOptions;

    constructor(readonly Definition: IFunctionDefinition<TArg, TResult>) {
        this._options = {
            timeoutSeconds: Definition.Timeout,
        };
    }

    get Worker() { return this._worker; }

    get Function() {
        if (!this._func) {
            this._func = createFunction(this.Worker, this._options);
        }
        return this._func;
    }

    get AuthFunction() {
        if (!this._authFunc) {
            this._authFunc = createAuthFunction(this.Worker, this._options);
        }
        return this._authFunc;
    }

    create<TWorkerExt extends TWorker>(worker: TWorkerExt) {
        this._worker = worker;
        this._worker.debugName = this._worker.debugName || this.Definition.CallableName;

        this._func = null;
        this._authFunc = null;
        return this as unknown as FunctionFactory<TArg, TResult, TWorkerExt>;
    }

    private addTo(target: any, namespaceLevel: boolean, func: FunctionWorker) {
        if (target) {
            let tt: any = target;
            if (namespaceLevel) {
                tt = target[this.Definition.Namespace];
                if (!tt) {
                    tt = { };
                    target[this.Definition.Namespace] = tt;
                }
            }

            if (tt[this.Definition.Name]) {
                throw new Error('Redefining function: ' + this.Definition.CallableName);
            }

            tt[this.Definition.Name] = func;
        }
        return this;
    }

    addFunctionTo(target: any, namespaceLevel = false) {
        return this.addTo(target, namespaceLevel, this.Function);
    }

    addAuthFunctionTo(target: any, namespaceLevel = false) {
        return this.addTo(target, namespaceLevel, this.AuthFunction);
    }
}

export class FunctionCompositeFactory<T extends CompositeEndpointInfo> extends FunctionFactory<EndpointArg<T>, EndpointResult<T>> {

    private _handlers: { [P in keyof T]?: FirebaseFunctionCall<ArgExtract<T, P>, ResExtract<T, P>> } = { };
    private readonly _logger: ILogger;

    constructor(readonly Composition: FunctionComposite<T>) {
        super(Composition.rootEndpoint);

        this._logger = createLogger(`[FunctionComposite:${Composition.rootEndpoint.CallableName}]`);

        super.create(async (data: EndpointArg<T>, ctx) => {
            const results: EndpointResult<T> = { };
            const keys: (keyof T)[] = Object.keys(data);
            for (const key of keys) {
                const h = this._handlers[key];
                if (h) {
                    try {
                        results[key] = await h(data[key], ctx);
                    } catch (err) {
                        this._logger.error('failed with input:', data, '\r\nERROR:', err);
                    }
                } else {
                    this._logger.warn('no handler for key', key, '; input is:', data);
                    throw AppHttpError.NotFound();
                }
            }
            return results;
        });
    }

    public create<TWorkerExt extends FirebaseFunctionCall<EndpointArg<T>, EndpointResult<T>>>(worker: TWorkerExt) {
        // eslint-disable-next-line no-console
        console.warn('FunctionCompositeFactory.create shouldn\'t be called directly. Use addHandler instead. Otherwise you don\'t need this class.');
        return super.create(worker);
    }

    public addHandler<P extends keyof T>(key: P, handler: FirebaseFunctionCall<ArgExtract<T, P>, ResExtract<T, P>>) {
        this._handlers[key] = handler;
        return this;
    }

}

export function endpointHandler<TA, TR>(spec: IFunctionDefinition<TA, TR>, handler: FirebaseFunctionCall<TA, TR>) { return handler; }
