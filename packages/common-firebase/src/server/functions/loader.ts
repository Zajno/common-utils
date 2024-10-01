import type * as functions from 'firebase-functions/v1';
import type { IMiddleware } from './middleware';
import { LazyPromise } from '@zajno/common/lazy/promise';
import { EndpointHandler } from './interface';
import {
    createHttpsRequestFunction,
    createScheduledFunction,
    RequestEndpointFunction,
    ScheduledFunction,
    SchedulerOptions,
} from './create';
import { ICompositionMiddleware, MiddlewaresMap } from './composite';
import { CompositeEndpointInfo, EndpointArg, EndpointResult } from '../../functions/composite';
import { ObjectOrPrimitive } from '@zajno/common/types/misc';

type Initializer<TArg> = (arg: TArg) => (void | Promise<void>);
type Loader<TArg> = () => Promise<Initializer<TArg>>;

export function useAsyncInitLoader<
    TMiddleware extends IMiddleware<TArg, TResult, TContext>,
    TArg,
    TResult,
    TContext extends ObjectOrPrimitive,
>(this: void, middleware: TMiddleware, initLoader: Loader<TMiddleware>) {
    const lazyPromise = new LazyPromise(async () => {
        const init = await initLoader();
        await init(middleware);
    });
    return middleware.useBeforeAll(async (_, next) => {
        await lazyPromise.promise;
        return next();
    });
}

export function useAsyncInitCompositionLoader<
    TMiddleware extends ICompositionMiddleware<T, TContext>,
    T extends CompositeEndpointInfo,
    TContext extends ObjectOrPrimitive
>(this: void, composition: TMiddleware, initLoader: Loader<MiddlewaresMap<T, TContext>>) {
    type Arg = EndpointArg<T>;
    type Res = EndpointResult<T>;

    return useAsyncInitLoader<TMiddleware, Arg, Res, TContext>(
        composition,
        () => initLoader()
            .then(res => ((comp: TMiddleware) => res(comp.handlers))),
    );
}

type Fn<TArgs extends any[]> = (...args: TArgs) => void | Promise<void>;

export function wrapLoaderFunction<TFn extends Fn<TArgs>, TArgs extends any[]>(workerLoader: () => Promise<TFn>): TFn {
    const lazyPromise = new LazyPromise(workerLoader);
    return (async (...args: TArgs) => {
        const handler = await lazyPromise.promise;
        return handler(...args);
    }) as TFn;
}


export function useAsync<TMiddleware extends IMiddleware<TArg, TResult, TContext>, TArg, TResult, TContext extends ObjectOrPrimitive>
    (this: void, middleware: TMiddleware, handlerLoader: () => Promise<EndpointHandler<TArg, TResult, TContext>>) {
    return middleware.use(wrapLoaderFunction(handlerLoader));
}

export function wrapRequestFunction(loader: () => Promise<RequestEndpointFunction>): RequestEndpointFunction {
    return wrapLoaderFunction(loader);
}

export function createAsyncHttpsRequestFunction<TRes = any>(workerLoader: () => Promise<RequestEndpointFunction<TRes>>, options: functions.RuntimeOptions | null = null): functions.HttpsFunction {
    return createHttpsRequestFunction(
        wrapRequestFunction(workerLoader),
        options,
    );
}

export function createAsyncScheduledFunction(schedule: string, workerLoader: () => Promise<ScheduledFunction>, options?: SchedulerOptions) {
    return createScheduledFunction(schedule, wrapLoaderFunction(workerLoader), options);
}
