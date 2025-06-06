import type { Nullable } from '../types/misc.js';

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
 *    return PromiseExtended
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
            ? safeGetPromise(worker)
            : worker;

        if (promise instanceof PromiseExtended) {
            return promise;
        }

        return new PromiseExtended<T, TErrors>(promise);
    }

    public static succeeded<T>(data: T): PromiseExtended<T> {
        return new PromiseExtended(Promise.resolve(data));
    }

    public static errored<T, TErrors extends Record<string, unknown>>(source: Error | Error[] | string): PromiseExtended<T, TErrors> {
        const err = typeof source === 'string' ? new Error(source) : source;
        const promise = new PromiseExtended<T, TErrors>(
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            Promise.reject(err),
        );
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
        config: PromiseExtended.ErrorConfig<TName, TError2, TCustomErrors>,
    ): PromiseExtended<T, TCustomErrors & Record<TName, TError2>>;

    public expectError<TName extends string, TError2 extends Error>(
        name: TName,
        ErrCtor: new (...args: any[]) => TError2,
        processor?: (value: TError2) => void | Partial<TCustomErrors & Record<TName, TError2>>,
    ): PromiseExtended<T, TCustomErrors & Record<TName, TError2>>;

    public expectError<TName extends string, TError2 extends Error>(
        nameOrConfig: TName | PromiseExtended.ErrorConfig<TName, TError2, TCustomErrors>,
        _ErrCtor?: new (...args: any[]) => TError2,
        _processor?: (value: TError2) => void | Partial<TCustomErrors & Record<TName, TError2>>,
    ): PromiseExtended<T, TCustomErrors & Record<TName, TError2>> {

        const { name, ErrCtor, processor } = typeof nameOrConfig === 'string'
            ? { name: nameOrConfig, ErrCtor: _ErrCtor!, processor: _processor }
            : nameOrConfig;

        this._errorProcessors.push(errorData => {
            const src = errorData?.source;
            if (src && src instanceof ErrCtor) {
                const res = processor?.(src);
                Object.assign(errorData, { [name]: src }, res);
            }
        });

        return this as PromiseExtended<T, Record<string, string>> as PromiseExtended<T, TCustomErrors & Record<TName, TError2>>;
    }

    then<TResult1 = T, TResult2 = never>(
        onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ) {
        const res = this as PromiseExtended<TResult1 | TResult2, TCustomErrors>;
        res._promise = this._promise.then(onfulfilled, onrejected);
        return res;
    }

    catch<TResult = never>(onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null) {
        const res = this as PromiseExtended<T | TResult, TCustomErrors>;
        res._promise = this._promise.catch(onrejected);
        return res;
    }

    finally(onfinally?: (() => void) | null) {
        this._promise = this._promise.finally(onfinally);
        return this;
    }

    toSuccessPromise(): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            this.onSuccess(() => resolve(true))
                .onError(() => resolve(false))
                // below is unreachable, but just in case
                .catch(() => {
                    /* istanbul ignore next -- @preserve */
                    resolve(false);
                });
        });
    }

    /* istanbul ignore next -- @preserve */
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

    export type ErrorConfig<TName extends string, TError2 extends Error, TPrevErrors> = {
        name: TName;
        ErrCtor: new (...args: any[]) => TError2;
        processor?: (value: TError2) => void | Partial<TPrevErrors & Record<TName, TError2>>;
    };

    export namespace ErrorConfig {
        export function createExpecter<TName extends string, TError2 extends Error>(
            config: Omit<ErrorConfig<TName, TError2, unknown>, 'processor'>,
        ) {
            return <T, TPrevErrors extends Record<string, unknown>>(
                promise: PromiseExtended<T, TPrevErrors>,
                processor?: (error: TError2) => void | Partial<TPrevErrors & Record<TName, TError2>>,
            ) => {
                return promise.expectError({ ...config, processor });
            };
        }
    }
}

/*

Idea: would be nice to combine few Promises and PromiseExtended's into one PromiseExtended instance, so the final result will be handled by onSuccess/onError

*/

class PromiseExtendedInnerMarker<T = any> extends Error {
    constructor(readonly instance: PromiseExtended<T>, readonly data: T) {
        super('This is a marker error for PromiseExtended instance, it should be handled internally. If you see this, it means an async function `PromiseExtended.pop()` was called in is not wrapped with `PromiseExtended.run()` or not awaited.');
    }
}

function safeGetPromise<T>(cb: () => Promise<T>): Promise<T> {
    try {
        const res = cb();
        if (res == null) {
            return Promise.reject(new Error('PromiseExtended: target promise is null or undefined'));
        }
        return res;
    } catch (err) {
        return Promise.reject(err as Error);
    }
}
