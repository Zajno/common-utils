import FFT from 'firebase-functions-test';
import type { ContextOptions } from 'firebase-functions-test/lib/main';
import type { FunctionFactory } from '../../server/functions/index.js';
import { AnyObject, ObjectOrPrimitive } from '@zajno/common/types/misc';

const FFTest = FFT({ });

export type EndpointTestContext = ContextOptions;
export type EndpointTestFunction<T, TOut> = (data: Partial<T>, context?: EndpointTestContext) => Promise<TOut>;

export function wrapEndpoint<A extends AnyObject, R extends AnyObject, C extends ObjectOrPrimitive>(fn: FunctionFactory<A, R, C>) {
    return FFTest.wrap(fn.Endpoint) as EndpointTestFunction<A, R>;
}

type Nested<T, K extends keyof T> = T[K] extends never ? never : Required<NonNullable<T[K]>>;

export function getNestedFunction<A, R, K extends (string & keyof A & keyof R)>(fn: EndpointTestFunction<A, R>, key: K): EndpointTestFunction<Nested<A, K>, Nested<R, K>> {
    return async (data, ctx) => {
        const parentArg = { [key]: data } as any as A;
        const result = await fn(parentArg, ctx);
        return result && result[key] as Nested<R, K>;
    };
}

afterAll(() => FFTest.cleanup());
