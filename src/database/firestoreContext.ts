import { TypedKeys } from '@zajno/common/lib/types';
import DBProvider, { FieldValue, FieldValueClass, TimestampClass } from './dbProvider';

export interface IFirestoreContext<DB extends DBProvider = DBProvider> {
    readonly db: DB;
    readonly FieldValue: FieldValueClass;
    readonly Timestamp: TimestampClass;
}

export type TimestampKey<T> = TypedKeys<T, number>;

export function setServerTimestamp<T>(ctx: IFirestoreContext, obj: T, ...keys: TimestampKey<T>[]) {
    return setFieldValue(ctx, obj, ...keys.map(k => ({ key: k, value: ctx.FieldValue.serverTimestamp() })));
}

export function setFieldValue<T, K = any>(ctx: IFirestoreContext, obj: T, ...entries: { key: TypedKeys<T, K>, value: FieldValue }[]) {
    entries.forEach(({ key, value }) => {
        obj[key] = value as any;
    });
    return obj;
}
