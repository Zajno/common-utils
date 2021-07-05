
export type Getter<T> = (obj: Partial<T>) => T[keyof T];
export type Setter<T> = (obj: Partial<T>, val: T[keyof T]) => void;
export type Comparer<T> = (source: Partial<T>, target: Partial<T>) => boolean;

export function updateField<T>(target: T, source: Partial<T>, diff: Partial<T>, key: keyof T, hasChanged: Comparer<T> = null): boolean {
    return updateFieldExtended(target, source, diff, t => t[key], (t, v) => t[key] = v, hasChanged);
}

export function updateFieldExtended<T>(
    target: T,
    source: Partial<T>,
    diff: Partial<T>,
    get: Getter<T>,
    set: Setter<T>,
    hasChanged: Comparer<T> = null,
): boolean {

    hasChanged = hasChanged || ((v1: T, v2: T) => (get(v1) !== get(v2)));

    let changed = true;

    if (get(source) !== undefined && hasChanged(source, target)) {
        changed = true;
        set(diff, get(target));
        set(target, get(source));
    }

    return changed;

}

export function updateArray<T extends string>(current: T[] | null, updated: T[]): { changed: number, result: T[] } {
    if (!updated) {
        return { changed: 0, result: current };
    }

    let changed = 0;
    const result = current || [];

    // remove all missing elements
    for (let i = 0; i < result.length; ++i) {
        if (!updated.includes(result[i])) {
            result.splice(i, 1);
            ++changed;
            --i;
        }
    }

    // add all new elements
    updated.forEach(i => {
        if (!result.includes(i)) {
            result.push(i);
            ++changed;
        }
    });

    result.sort();

    return {
        result,
        changed,
    };
}
