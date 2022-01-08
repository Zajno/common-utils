import { IdentAny } from '@zajno/common/lib/ident';
import {
    DocumentReference,
    DocumentSnapshotCallback,
    DocumentSnapshotConverterCallback,
    Query,
    QuerySnapshotCallback,
    QuerySnapshotConverterCallback,
} from './dbProvider';
import { IFirestoreContext } from './firestoreContext';
import { documentSnapshot, querySnapshot } from './helpers';


type DataProcessor<T> = (data: T) => T;

export class BaseRepo<T extends IdentAny> {
    private _readConverter: DataProcessor<T> = null;
    private _timestampKeys: (keyof T)[] = [];

    constructor(protected readonly firestore: IFirestoreContext) { }

    protected get db() { return this.firestore.db; }

    useConverter(read: DataProcessor<T>) {
        this._readConverter = read;
        return this;
    }

    useTimestampKeys(...keys: (keyof T)[]) {
        this._timestampKeys = keys;
        return this;
    }

    query(query: Query<T>, cb: QuerySnapshotCallback<T> = null) {
        return querySnapshot(this.db, query, cb, this.queryConverter);
    }

    document(doc: DocumentReference<T>, cb: DocumentSnapshotCallback<T> = null) {
        return documentSnapshot(this.db, doc, cb, this.docConverter);
    }

    protected queryConverter: QuerySnapshotConverterCallback<T> = (items) => {
        return items.map(this.docConverter);
    };

    protected docConverter: DocumentSnapshotConverterCallback<T> = item => {
        let d = item.data() as T;
        d.id = item.id;
        if (this._readConverter) {
            d = this._readConverter(d);
        }
        if (this._timestampKeys.length > 0) {
            this._timestampKeys.forEach(key => {
                const v = d[key];
                if (v != null && v instanceof this.firestore.Timestamp) {
                    d[key] = v.toMillis() as any;
                }
            });
        }
        return d;
    };
}
