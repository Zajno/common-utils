import type { Nullable } from '../types/misc';

/**
 * The idea here is to wrap a promise (or promise getter) so it will never throw natively, but still be able to provide success/fail results:
 * - `onSuccess` for handling successful result: like `then` but to be called only if there was no error
 * - `onError` for handling error: like `catch` but with extended error format
 * - `expectError` adds a specific Error sub-class caster and adds it to the error data; useful when expecting some kind of specific error
 *
 * Important: all methods are chainable however will return the same PromiseExtended instance,
 * while native Promise methods return a new Promise instance on each `then`/`catch`/`finally` call.
 * Internally it just replaces the promise reference.
 *
 * Usage example:
 *
 * ```ts
 * function doWork() {
 *    return new PromiseExtended()
 *      .run(async () => {
 *          // return 42;
 *          throw new Error('Some error');
 *     });
 * }
 *
 * dowWork()
 *   // if no error, will return 42
 *   .onSuccess(data => console.log('Success:', data))
 *   // if error, will return { error: 'Some error', source: Error }
 *   .onError(({ error, source }) => console.error('Error Message:', error, '; original:', source))
 *   // this is possible to be called only if handlers throw
 *   .catch(err => console.error('Really unexpected error:', err));
 *
 * ```
 *
 * NOTE: regular `then`/`catch` will still work, but they will go after `catch` in the chain,
 * so basically every `then` will be called unless some previous handler throws,
 * and every `catch` will NOT be called unless there was an error in any previous handler.
 *
 * If passed promise resolve is `PromiseExtended` instance, current instance will redirect everything to it.
 *
 */
export class PromiseExtended<T, TCustomErrors extends Record<string, unknown> = Record<never, unknown>> implements Promise<T> {

    protected _error: PromiseExtended.ErrorData | null = null;

    private _promise: Promise<T>;
    private readonly _errorProcessors: ((data: PromiseExtended.ErrorData) => void)[] = [];

    private constructor(promise: Promise<T>) {
        this._promise = promise.catch(this._catch) as Promise<T>;
    }

    public static run<T, TErrors extends Record<string, unknown> = Record<never, unknown>>(worker: Promise<T> | (() => Promise<T>)): PromiseExtended<T, TErrors> {
        const promise = typeof worker === 'function'
            ? worker()
            : worker;

        if (promise instanceof PromiseExtended) {
            return promise;
        }

        return new PromiseExtended<T, TErrors>(promise);
    }

    public static succeeded<T>(data: T): PromiseExtended<T> {
        return new PromiseExtended(Promise.resolve(data));
    }

    public static errored<T, TErrors extends Record<string, unknown>>(source: Error | string): PromiseExtended<T, TErrors> {
        const err = typeof source === 'string' ? new Error(source) : source;
        const promise = new PromiseExtended<T, TErrors>(Promise.reject(err));
        return promise;
    }

    public onError(cb: Nullable<(data: PromiseExtended.ErrorData & TCustomErrors) => void>): this {
        if (cb != null) {
            this._promise = this._promise.then(data => {
                if (this._error) {
                    cb(this.getError());
                }
                return data;
            });
        }
        return this;
    }

    public onSuccess(cb: Nullable<(data: T) => void>): this {
        if (cb != null) {
            this._promise = this._promise.then(data => {
                if (!this._error) {
                    cb(data);
                }
                return data;
            });
        }
        return this;
    }

    public expectError<TName extends string, TError2 extends Error>(
        name: TName,
        ErrCtor: new (...args: any[]) => TError2,
        processor?: (value: TError2) => void,
    ): PromiseExtended<T, TCustomErrors & Record<TName, TError2>> {

        this._errorProcessors.push(errorData => {
            const src = errorData?.source;
            if (src && src instanceof ErrCtor) {
                processor?.(src);
                Object.assign(errorData, { [name]: errorData.source });
            }
        });

        return this as PromiseExtended<T, Record<string, string>> as PromiseExtended<T, TCustomErrors & Record<TName, TError2>>;
    }

    then<TResult1 = T, TResult2 = never>(
        onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null | undefined,
    ) {
        const res = this as PromiseExtended<TResult1 | TResult2, TCustomErrors>;
        res._promise = this._promise.then(onfulfilled, onrejected);
        return res;
    }

    catch<TResult = never>(onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null | undefined) {
        const res = this as PromiseExtended<T | TResult, TCustomErrors>;
        res._promise = this._promise.catch(onrejected);
        return res;
    }

    finally(onfinally?: (() => void) | null | undefined) {
        this._promise = this._promise.finally(onfinally);
        return this;
    }

    get [Symbol.toStringTag](): string { return this._promise[Symbol.toStringTag]; }

    private getError() {
        const data = {
            error: this._error!.error,
            source: this._error!.source,
        };

        this._errorProcessors.forEach(p => p(data));

        return data as PromiseExtended.ErrorData & TCustomErrors;
    }

    private _catch = (err: unknown) => {
        if (err instanceof PromiseExtendedInnerMarker) {
            // we've caught the marker, so we need to redirect everything to the inner instance
            // first, if we still didn't catch any error, we're taking it from the inner instance
            if (!this._error && err.instance._error) {
                this.onErrorCaught(err.instance.getError());
            }
            // returning inner promise will also resolve with their resolved data
            return err.data;
        }

        let message = '';
        if (Array.isArray(err)) {
            message = err.map(e => (e as Error).message).join('\n');
        } else {
            message = (err as Error).message;
        }

        this.onErrorCaught({ error: message, source: err as Error });

        return undefined;
    };

    /** Adds to the end of chain special marker that allow outer PromiseExtended to correctly process this instance with its own onSuccess/onError callbacks.
     *
     * See `example for combining` test case for more details.
     */
    public pop() {
        return this.then<T, T>(data => {
            throw new PromiseExtendedInnerMarker(this, data);
        });
    }

    protected onErrorCaught(data: PromiseExtended.ErrorData) {
        this._error = data;
    }
}

export namespace PromiseExtended {
    export type ErrorData = {
        error: string;
        source: Error;
    };
}

/*

Idea: would be nice to combine few Promises and PromiseExtended's into one PromiseExtended instance, so the final result will be handled by onSuccess/onError

*/

class PromiseExtendedInnerMarker<T = any> extends Error {
    constructor(readonly instance: PromiseExtended<T>, readonly data: T) {
        super('This is a marker error for PromiseExtended instance, it should be handled internally. If you see this, it means an async function `PromiseExtended.pop()` was called in is not wrapped with `PromiseExtended.run()` or not awaited.');
    }
}
