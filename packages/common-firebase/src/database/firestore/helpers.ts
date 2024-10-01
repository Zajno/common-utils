import type { TypedKeys } from '@zajno/common/types';

export function setFieldValue<T extends object, K = any>(obj: T, ...entries: { key: TypedKeys<T, K>, value: object }[]) {
    entries.forEach(({ key, value }) => {
        obj[key] = value as any;
    });
    return obj;
}
