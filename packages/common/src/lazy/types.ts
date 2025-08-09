
export type ILazy<T> = {
    readonly value: T;
    readonly hasValue: boolean;
    /** should not call the factory or change the value either way */
    readonly currentValue: T | undefined;
};

export type ILazyPromise<T> = ILazy<T> & {
    readonly isLoading: boolean | null;
    readonly promise: Promise<T>;
};
