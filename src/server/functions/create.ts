import * as functions from 'firebase-functions';
import { EndpointFunction, FirebaseEndpoint } from './interface';
import * as RepoErrorAdapter from '../utils/RepoErrorAdapter';

export function createHttpsFunction<T = any, TOut = void>(worker: EndpointFunction<T, TOut>, options: functions.RuntimeOptions = null): FirebaseEndpoint {
    const builder = options
        ? functions.runWith(options)
        : functions;

    return builder.https.onCall(
        filterRequestMethod(
            RepoErrorAdapter.wrapRepoError(worker, worker.debugName),
        ),
    );
}

export function filterRequestMethod<T, TOut>(handler: EndpointFunction<T, TOut>): EndpointFunction<T, TOut> {
    return (data, ctx) => {
        if (ctx?.rawRequest && ctx.rawRequest.method !== 'POST') {
            return Promise.resolve({} as TOut);
        }
        return handler(data, ctx);
    };
}
