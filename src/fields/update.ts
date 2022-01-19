import { safeCall } from '../functions';
import { Comparator } from '../types';

export namespace Fields {
    export type Getter<T> = (obj: Partial<T>) => T[keyof T];
    export type Setter<T> = (obj: Partial<T>, val: T[keyof T]) => void;
    export type Comparer<T> = (source: Partial<T>, target: Partial<T>) => boolean;
    export type Updater<T> = (target: T, source: T) => T;
}


export function updateField<T>(target: T, source: Partial<T>, diff: Partial<T>, key: keyof T, hasChanged: null | Fields.Comparer<T> = null): boolean {
    return updateFieldExtended(target, source, diff, t => t[key], (t, v) => t[key] = v, hasChanged);
}

export function updateFieldExtended<T>(
    target: T,
    source: Partial<T>,
    diff: Partial<T>,
    get: Fields.Getter<T>,
    set: Fields.Setter<T>,
    hasChanged: null | Fields.Comparer<T> = null,
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

const DefaultComparator: Comparator<any> = (v1, v2) => v1 === v2;
const DefaultUpdater: Fields.Updater<any> = (v1, v2) => Object.assign(v1, v2);

export type UpdateArrayOptions<T> = {
    additive?: boolean,
    clone?: boolean,
    comparator?: Comparator<T>,
    updater?: Fields.Updater<T>,
    sorter?: Comparator<T, number> | null | undefined,
    hooks?: UpdateArrayHooks<T>,
};

export type UpdateArrayHooks<T> = {
    onAdded?: (item: T) => void,
    onDeleted?: (item: T) => void,
    onUpdated?: (previous: T, next: T) => void,
};

export function updateArray<T>(
    target: T[] | null,
    source: T[],
    options?: UpdateArrayOptions<T>,
): { changed: number, result: T[] } {
    if (!source) {
        return { changed: 0, result: target };
    }

    let changed = 0;
    const result = Array.isArray(target)
        ? (options?.clone ? target.slice() : target)
        : [];

    const comparator = options?.comparator || DefaultComparator;
    const updater = options?.updater || DefaultUpdater;
    const onDeleted = options?.hooks?.onDeleted;
    const onUpdate = options?.hooks?.onUpdated;
    const onAdded = options?.hooks?.onAdded;

    // remove all missing elements
    if (!options?.additive) {
        for (let i = 0; i < result.length; ++i) {
            if (source.find(item => comparator(item, result[i])) == null) {
                // DELETE
                const removed = result.splice(i, 1);
                safeCall(onDeleted, removed[0]);

                ++changed;
                --i;
            }
        }
    }

    // add all new elements and update existing
    source.forEach(i => {
        const existingIndex = result.findIndex(item => comparator(i, item));
        const existingItem = result[existingIndex];
        if (existingIndex < 0) {
            result.push(i);
            safeCall(onAdded, i);
            ++changed;
        } else if (typeof existingItem === 'object') {
            const before = onUpdate != null ? { ...existingItem } : undefined;
            result[existingIndex] = updater(existingItem, i);
            if (onUpdate != null) {
                onUpdate(before!, result[existingIndex]);
            }
        }
    });

    const sorter = options?.sorter;
    if (sorter !== null) {
        result.sort(sorter || undefined);
    }

    return {
        result,
        changed,
    };
}
