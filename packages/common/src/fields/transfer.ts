
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

    export function defined<T>(
        source: T,
        destination: Partial<T>,
        ...fields: (keyof T)[]
    ): number {
        return transferFields(source, (f, v) => v !== undefined, destination, ...fields);
    }

    export function changed<T>(
        source: T,
        compare: T,
        destination: Partial<T>,
        ...fields: (keyof T)[]
    ): number {
        return transferFields(
            source,
            (f, v) => v !== undefined && source[f] !== compare[f],
            destination,
            ...fields,
        );
    }
}

export function hasChangedFields<T>(left: T, right: T, ...fields: (keyof T)[]) {
    return fields.some(f => left[f] !== right[f]);
}

type ExtractChangedFieldsResult<T> = {
    transferred: number;
    result: Partial<T>;
};

// undefined fields are ignored
export function extractChangedFields<T>(
    source: Partial<T>,
    image: T,
    ...fields: (keyof T)[]
): ExtractChangedFieldsResult<T> {
    const res: Partial<T> = {};
    const count = transferFields<Partial<T>>(
        source,
        (f, v) => v !== undefined && v !== image[f],
        res,
        ...fields,
    );
    return {
        transferred: count,
        result: res,
    };
}
