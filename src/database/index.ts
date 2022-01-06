import DBProvider, { FieldValueClass } from './dbProvider';
import LogicError from './LogicError';

export {
    DBProvider,
    LogicError as RepoError,
};

export * from './dbProvider';
export * from './helpers';

export interface IFirestoreContext<DB extends DBProvider = DBProvider> {
    readonly db: DB;
    readonly FieldValue: FieldValueClass;
}
