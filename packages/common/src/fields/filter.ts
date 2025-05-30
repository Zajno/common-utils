
export type FieldFilter<T> = (value: T[keyof T] | undefined) => boolean;

export function filterFields<T>(source: Partial<T>, ...fields: ((keyof T) | { key: keyof T, filter: FieldFilter<T>})[]): Partial<T> {
    const res: Partial<T> = { };

    fields.forEach(k => {
        if (typeof k === 'object') {
            const v = source[k.key];
            if (k.filter(v)) {
                res[k.key] = v;
            }
        } else {
            const v = source[k];
            if (v) {
                res[k] = v;
            }
        }
    });

    return res;
}
