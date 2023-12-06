
export function nameof<TObject>(obj: TObject, key: keyof TObject): string;
export function nameof<TObject>(key: keyof TObject): string;
export function nameof(key1: any, key2?: any): any {
  return key2 ?? key1;
}

export namespace nameof {

    type StringKeyOf<T> = keyof T & string;

    type Builder<T> = {
        key<TKey extends StringKeyOf<T>>(key: TKey): BuilderRes<T[TKey]>;
    };

    type BuilderRes<T> = Builder<T> & { result: string };

    function getBuilderRes<T>(k: string, prev?: string): BuilderRes<T> {
        const res = prev
            ? (prev + '.' + k)
            : k;
        return {
            result: res,
            key(key) { return getBuilderRes(key as any, res); },
        };
    }

    export function full<T>(_obj?: T): Builder<T> {
        return {
            key(k) {
                return getBuilderRes(k as any);
            },
        };
    }
}
