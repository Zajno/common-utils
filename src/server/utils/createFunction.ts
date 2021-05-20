/* eslint-disable proposal/class-property-no-initialized */
import * as functions from 'firebase-functions';
import * as RepoErrorAdapter from './RepoErrorAdapter';
import { FunctionDefinition } from '../../functions';

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

export class FunctionFactory<TArg, TResult, TWorker extends FirebaseFunctionCall<TArg, TResult> = FirebaseFunctionCall<TArg, TResult>> {
    private _worker: TWorker;

    private _func: ReturnType<typeof createFunction>;
    private _authFunc: ReturnType<typeof createAuthFunction>;

    private _options: functions.RuntimeOptions;

    constructor(readonly Definition: FunctionDefinition<TArg, TResult>) {
        this._options = {
            timeoutSeconds: Definition.Timeout,
        };
    }

    get Worker() { return this._worker; }

    get Function() {
        if (!this._func) {
            this._func = createFunction(this._worker, this._options);
        }
        return this._func;
    }

    get AuthFunction() {
        if (!this._authFunc) {
            this._authFunc = createAuthFunction(this._worker, this._options);
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

    addFunctionTo(target: any) {
        if (target) {
            target[this.Definition.Name] = this.Function;
        }
        return this;
    }

    addAuthFunctionTo(target: any) {
        if (target) {
            target[this.Definition.Name] = this.AuthFunction;
        }
        return this;
    }
}
