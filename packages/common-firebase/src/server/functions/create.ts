import * as functions from 'firebase-functions/v1';
import { EndpointContext, EndpointFunction, EndpointHandler, FirebaseEndpointRunnable } from './interface';
import logger from '@zajno/common/logger';
import { GlobalRuntimeOptions } from './globalSettings';

type PromiseOrT<T> = PromiseLike<T> | T;

export type RequestEndpointFunction<TRes = any> = (req: functions.https.Request, resp: functions.Response<TRes>) => void | Promise<void>;
export type ScheduledFunction = ((context: functions.EventContext) => PromiseOrT<any>);
export type PubSubTopicListener = (message: functions.pubsub.Message, context: functions.EventContext) => PromiseOrT<any>;
export type SchedulerOptions = { timeZone?: string, runtime?: functions.RuntimeOptions };

export function createHttpsCallFunction<T = any, TOut = void>(
    worker: EndpointFunction<T, TOut>,
    options: functions.RuntimeOptions | null = null,
): FirebaseEndpointRunnable {
    return getBaseBuilder(options)
        .https.onCall((data, ctx) => {
            const eCtx = ctx as EndpointContext;
            // if (!eCtx.endpoint) {
            //     logger.warn('[createHttpsCallFunction] Endpoint context is not defined, further logic may fail. Request url =', ctx.rawRequest?.url);
            // }
            return worker(data, eCtx);
        });
}

export function createHttpsRequestFunction<TRes = any>(worker: RequestEndpointFunction<TRes>, options: functions.RuntimeOptions | null = null): functions.HttpsFunction {
    return getBaseBuilder(options).https.onRequest(worker);
}

export function createScheduledFunction(schedule: string, worker: ScheduledFunction, options?: SchedulerOptions) {
    let builder = getBaseBuilder(options?.runtime).pubsub.schedule(schedule);
    if (options?.timeZone) {
        builder = builder.timeZone(options.timeZone);
    }

    return builder.onRun(worker);
}

export function createTopicListener(topicName: string, listener: PubSubTopicListener, options: functions.RuntimeOptions | null = null) {
    return getBaseBuilder(options).pubsub.topic(topicName).onPublish(listener);
}

function getBaseBuilder(runtimeOptions: functions.RuntimeOptions | undefined | null) {
    const options = Object.assign({}, GlobalRuntimeOptions.value, runtimeOptions);
    return functions.runWith(options);
}

const DefaultAllowMethods = ['POST'];

export const FilterRequestMethod = (methods: string[] = DefaultAllowMethods) => {
    const middleware: EndpointHandler<any, any, any> = (ctx, next) => {
        if (ctx?.rawRequest && !methods.includes(ctx.rawRequest.method)) {
            logger.log('Request has been skipped because HTTP method =', ctx.rawRequest.method);
            return Promise.resolve();
        }

        return next();
    };
    return middleware;
};
