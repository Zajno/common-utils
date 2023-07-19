
export type SkipOptions = 'falsy' | 'null' | boolean;
export type SkipKey<K extends string> = `${K}Skip`;
export type SkipKeysOf<T> = { [K in keyof T]: K extends string ? SkipKey<K> : never }[keyof T];
export type SkipKeysOfMap<T> = Partial<Record<SkipKeysOf<T>, SkipOptions>>;

export type SkipKeysMapOf<T> = {
    [K in keyof T]: K extends string ? SkipKey<K> : never;
};

export namespace SkipOptions {
    export function shouldSkip<T = any>(v: T, skip: SkipOptions): boolean {
        if (v == null && skip === 'null') {
            return true;
        }
        if (!v && (skip === 'falsy' || skip === true)) {
            return true;
        }

        return false;
    }
}

export type SkipCondition<T, TKey extends keyof T = keyof T> = SkipOptions | ((key: TKey, val: T[TKey]) => boolean);

export namespace SkipCondition {
    export function shouldSkip<T, TKey extends keyof T = keyof T>(condition: SkipCondition<T, TKey>, key: TKey, val: T[TKey]): boolean {
        if (typeof condition === 'function') {
            if (condition(key, val)) {
                return true;
            }
        } else if (SkipOptions.shouldSkip<T[TKey]>(val, condition)) {
            return true;
        }

        return false;
    }
}
