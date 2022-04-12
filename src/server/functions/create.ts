import * as functions from 'firebase-functions';
import { EndpointFunction, EndpointHandler, FirebaseEndpointRunnable } from './interface';
import logger from '@zajno/common/lib/logger';

export function createHttpsFunction<T = any, TOut = void>(worker: EndpointFunction<T, TOut>, options: functions.RuntimeOptions = null): FirebaseEndpointRunnable {
    const builder = options
        ? functions.runWith(options)
        : functions;

    return builder.https.onCall(worker);
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
