import FFT from 'firebase-functions-test';
import { ContextOptions } from 'firebase-functions-test/lib/main';
import { FunctionFactory } from '../../server/functions';

const FFTest = FFT({ });

export type EndpointTestContext = ContextOptions;
export type EndpointTestFunction<T, TOut> = (data: Partial<T>, context?: EndpointTestContext) => Promise<TOut>;

export function wrapEndpoint<A, R, C>(fn: FunctionFactory<A, R, C>) {
    return FFTest.wrap(fn.Endpoint) as EndpointTestFunction<A, R>;
}

export function getNestedFunction<A, R, K extends (keyof A & keyof R)>(fn: EndpointTestFunction<A, R>, key: K): EndpointTestFunction<A[K], R[K]> {
    return async (data, ctx) => {
        const parentArg = { [key]: data } as any as A;
        const result = await fn(parentArg, ctx);
        return result && result[key] as R[K];
    };
}

afterAll(() => FFTest.cleanup());
