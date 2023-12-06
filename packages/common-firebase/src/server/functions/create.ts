import * as functions from 'firebase-functions';
import { EndpointFunction, EndpointHandler, FirebaseEndpointRunnable } from './interface';
import logger from '@zajno/common/logger/index';
import { GlobalRuntimeOptions } from './globalSettings';

export type RequestEndpointFunction<TRes = any> = (req: functions.https.Request, resp: functions.Response<TRes>) => void | Promise<void>;
export type ScheduledFunction = ((context: functions.EventContext) => PromiseLike<any> | any);
export type PubSubTopicListener = (message: functions.pubsub.Message, context: functions.EventContext) => PromiseLike<any> | any;
export type SchedulerOptions = { timeZone?: string, runtime?: functions.RuntimeOptions };

export function createHttpsCallFunction<T = any, TOut = void>(worker: EndpointFunction<T, TOut>, options: functions.RuntimeOptions = null): FirebaseEndpointRunnable {
    return getBaseBuilder(options).https.onCall(worker);
}

export function createHttpsRequestFunction<TRes = any>(worker: RequestEndpointFunction<TRes>, options: functions.RuntimeOptions = null): functions.HttpsFunction {
    return getBaseBuilder(options).https.onRequest(worker);
}

export function createScheduledFunction(schedule: string, worker: ScheduledFunction, options?: SchedulerOptions) {
    let builder = getBaseBuilder(options?.runtime).pubsub.schedule(schedule);
    if (options?.timeZone) {
        builder = builder.timeZone(options.timeZone);
    }

    return builder.onRun(worker);
}

export function createTopicListener(topicName: string, listener: PubSubTopicListener, options: functions.RuntimeOptions = null) {
    return getBaseBuilder(options).pubsub.topic(topicName).onPublish(listener);
}

function getBaseBuilder(runtimeOptions: functions.RuntimeOptions | undefined | null) {
    const options = Object.assign({}, GlobalRuntimeOptions.value, runtimeOptions);
    return functions.runWith(options);
}

const DefaultAllowMethods = ['POST'];

export const FilterRequestMethod = (methods: string[] = DefaultAllowMethods) => {
    const mdlwr: EndpointHandler<any, any, any> = (ctx, next) => {
        if (ctx?.rawRequest && !methods.includes(ctx.rawRequest.method)) {
            logger.log('Request has been skipped because HTTP method =', ctx.rawRequest.method);
            return Promise.resolve();
        }

        return next();
    };
    return mdlwr;
};
