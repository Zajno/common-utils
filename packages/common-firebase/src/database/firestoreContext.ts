import { AnyObject, TypedKeys } from '@zajno/common/types/misc';
import DBProvider, { FieldPathClass, FieldValue, FieldValueClass, TimestampClass } from './dbProvider';

export interface IFirestoreContext<DB extends DBProvider = DBProvider> {
    readonly db: DB;
    readonly FieldValue: FieldValueClass;
    readonly FieldPath: FieldPathClass;
    readonly Timestamp: TimestampClass;
}

export type TimestampKey<T extends AnyObject> = TypedKeys<T, number>;

export function setServerTimestamp<T extends AnyObject>(ctx: IFirestoreContext, obj: T, ...keys: TimestampKey<T>[]) {
    return setFieldValue(ctx, obj, ...keys.map(k => ({ key: k, value: ctx.FieldValue.serverTimestamp() })));
}

export function setFieldValue<T extends AnyObject, K = any>(ctx: IFirestoreContext, obj: T, ...entries: { key: TypedKeys<T, K>, value: FieldValue }[]) {
    entries.forEach(({ key, value }) => {
        obj[key] = value as T[TypedKeys<T, K>];
    });
    return obj;
}
