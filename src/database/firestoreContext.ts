import DBProvider, { FieldValueClass, TimestampClass } from './dbProvider';

export interface IFirestoreContext<DB extends DBProvider = DBProvider> {
    readonly db: DB;
    readonly FieldValue: FieldValueClass;
    readonly Timestamp: TimestampClass;
}
