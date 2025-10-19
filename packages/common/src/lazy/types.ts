
/** Represents a lazily loaded value. */
export interface ILazy<T> {
    /** Returns current value. If not loaded, loading is triggered. */
    readonly value: T;

    /** Returns whether has current value. Loading is not triggered. */
    readonly hasValue: boolean;

    /** Returns current value or undefined if not present. Loading is not triggered. */
    readonly currentValue: T | undefined;
};

/** Represents a lazily asynchronously loaded value. */
export interface ILazyPromise<T, TInitial extends T | undefined = undefined> extends ILazy<T | TInitial> {
    /** Returns true if loading is in progress, false if loading is completed, null if loading was not initiated. Loading is not triggered. */
    readonly isLoading: boolean | null;

    /** Returns the promise for the current value. If not loaded, loading is triggered. */
    readonly promise: Promise<T>;
};
