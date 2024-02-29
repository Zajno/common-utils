import { Comparator } from '../types';

export namespace Fields {
    export type Getter<T> = (obj: Partial<T>) => (T[keyof T] | undefined);
    export type Setter<T> = (obj: Partial<T>, val: T[keyof T] | undefined) => void;
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

    const _hasChanged: Fields.Comparer<T> = hasChanged ?? ((v1, v2) => (get(v1) !== get(v2)));

    let changed = true;

    if (get(source) !== undefined && _hasChanged(source, target)) {
        changed = true;
        set(diff, get(target));
        set(target, get(source));
    }

    return changed;

}

const DefaultComparator: Comparator<any> = (v1, v2) => v1 === v2;
const DefaultUpdater: Fields.Updater<any> = <T extends object>(v1: T, v2: T) => Object.assign(v1, v2);

export type UpdateArrayOptions<T> = {
    additive?: boolean,
    unshift?: boolean,
    clone?: boolean,
    comparator?: Comparator<T>,
    updater?: Fields.Updater<T>,
    sorter?: Comparator<T, number> | null | undefined,
    hooks?: UpdateArrayHooks<T>,
};

export type UpdateArrayHooks<T> = {
    onAdded?: (item: T, index?: number) => void,
    onDeleted?: (item: T, index?: number) => void,
    onUpdated?: (previous: T | null | undefined, next: T, index?: number) => void,
};

export function updateArray<T>(
    target: T[] | null,
    source: T[] | null,
    options?: UpdateArrayOptions<T>,
): { changed: number, result: T[] | null } {
    if (!source) {
        return { changed: 0, result: target };
    }

    let changed = 0;
    const result = Array.isArray(target)
        ? (options?.clone ? target.slice() : target)
        : [];

    const comparator = options?.comparator || DefaultComparator;
    const updater = options?.updater || DefaultUpdater as Fields.Updater<T>;
    const onDeleted = options?.hooks?.onDeleted;
    const onUpdate = options?.hooks?.onUpdated;
    const onAdded = options?.hooks?.onAdded;

    // remove all missing elements
    if (!options?.additive) {
        for (let i = 0; i < result.length; ++i) {
            if (source.find(item => comparator(item, result[i])) == null) {
                // DELETE
                const removed = result.splice(i, 1);
                onDeleted?.(removed[0], i);

                ++changed;
                --i;
            }
        }
    }

    const unshift = options?.unshift || false;

    // add all new elements and update existing
    source.forEach(item => {
        const existingIndex = result.findIndex(i => comparator(item, i));
        const existingItem = result[existingIndex];
        if (existingIndex < 0) {
            if (unshift) {
                result.unshift(item);
            } else {
                result.push(item);
            }
            onAdded?.(item, unshift ? 0 : result.length - 1);
            ++changed;
        } else if (typeof existingItem === 'object') {
            const before = onUpdate != null ? { ...existingItem } : undefined;
            result[existingIndex] = updater(existingItem, item);
            if (onUpdate != null) {
                onUpdate(before, result[existingIndex], existingIndex);
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
