
export type FieldFilter<T> = (value: T[keyof T]) => boolean;

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

export namespace filterFields {
    export function Truethy<T>(): FieldFilter<T> { return (v) => !!v; }
    export function NotNull<T>(): FieldFilter<T> { return v => v != null; }
}

// Alternative, TODO review
export function transferFields<T>(
    source: T,
    predicate: (f: keyof T, v: T[keyof T]) => boolean,
    destination: Partial<T>,
    ...fields: (keyof T)[]
): number {
    let count = 0;
    fields.forEach(f => {
        const v = source[f];
        if (!predicate || predicate(f, v)) {
            destination[f] = v;
            ++count;
        }
    });

    return count;
}

export namespace transferFields {
    export function truthy<T>(
        source: T,
        destination: Partial<T>,
        ...fields: (keyof T)[]
    ): number {
        return transferFields(source, (f, v) => !!v, destination, ...fields);
    }

    export function notNull<T>(
        source: T,
        destination: Partial<T>,
        ...fields: (keyof T)[]
    ): number {
        return transferFields(source, (f, v) => v != null, destination, ...fields);
    }
}

export function hasChangedFields<T>(left: T, right: T, ...fields: (keyof T)[]) {
    return fields.some(f => left[f] !== right[f]);
}
