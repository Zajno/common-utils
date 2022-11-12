import * as functions from 'firebase-functions';
import { EndpointFunction, EndpointHandler, FirebaseEndpointRunnable } from './interface';
import logger from '@zajno/common/lib/logger';

export type RequestEndpointFunction<TRes = any> = (req: functions.https.Request, resp: functions.Response<TRes>) => void | Promise<void>;
export type ScheduledFunction = ((context: functions.EventContext) => PromiseLike<any> | any);
export type SchedulerOptions = { timeZone?: string };

export function createHttpsCallFunction<T = any, TOut = void>(worker: EndpointFunction<T, TOut>, options: functions.RuntimeOptions = null): FirebaseEndpointRunnable {
    const builder = options
        ? functions.runWith(options)
        : functions;

    return builder.https.onCall(worker);
}

export function createHttpsRequestFunction<TRes = any>(worker: RequestEndpointFunction<TRes>, options: functions.RuntimeOptions = null): functions.HttpsFunction {
    const builder = options
        ? functions.runWith(options)
        : functions;

    return builder.https.onRequest(worker);
}

export function createScheduledFunction(schedule: string, worker: ScheduledFunction, options?: SchedulerOptions) {
    let builder = functions.pubsub.schedule(schedule);
    if (options?.timeZone) {
        builder = builder.timeZone(options.timeZone);
    }

    return builder.onRun(worker);
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
