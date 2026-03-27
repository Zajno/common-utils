import type { Nullable } from '../types/index.js';

type LaxPromise<T> = Promise<T> | T | void;

export function catchPromise(promise: LaxPromise<any>, errorCb?: (err: any) => void) {
    Promise.resolve(promise).catch(err => errorCb?.(err));
}

export function wrapAsync<T, TArgs extends any[]>(fn: Nullable<(...args: TArgs) => LaxPromise<T>>, errorCb?: (err: any) => void): (...args: TArgs) => void {
    return (...args: TArgs) => {
        if (fn) {
            catchPromise(fn(...args), errorCb);
        }
    };
}

/**
 * Formats an unknown caught value into a human-readable string.
 *
 * Useful at presentation boundaries where a display string is needed.
 * Prefer keeping the raw error for programmatic handling (instanceof checks, .cause, etc.).
 */
export function formatError(err: unknown): string {
    if (typeof err === 'string') {
        return err;
    }
    if (err instanceof Error) {
        return err.message;
    }
    return String(err) || 'Unknown error';
}
