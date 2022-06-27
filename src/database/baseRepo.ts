import { IdentAny } from '@zajno/common/lib/ident';
import {
    DocumentReference,
    DocumentSnapshotCallback,
    DocumentSnapshotConverterCallback,
    Query,
    QuerySnapshotCallback,
    QuerySnapshotConverterCallback,
    UnsubscribeSnapshot,
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

    public query(query: Query<T>): Promise<T[]>;
    public query(query: Query<T>, cb: QuerySnapshotCallback<T>): Promise<UnsubscribeSnapshot>;

    query(query: Query<T>, cb?: QuerySnapshotCallback<T>): Promise<T[] | UnsubscribeSnapshot> {
        return querySnapshot(this.db, query, cb, this.queryConverter);
    }

    document(doc: DocumentReference<T>): Promise<T>;
    document(doc: DocumentReference<T>, cb: DocumentSnapshotCallback<T>): Promise<UnsubscribeSnapshot>;

    document(doc: DocumentReference<T>, cb: DocumentSnapshotCallback<T> = null): Promise<T | UnsubscribeSnapshot> {
        return documentSnapshot(this.db, doc, cb, this.convertDocumentSnapshot);
    }

    protected queryConverter: QuerySnapshotConverterCallback<T> = (items) => {
        return items.map(this.convertDocumentSnapshot);
    };

    public convertDocumentSnapshot: DocumentSnapshotConverterCallback<T> = item => {
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
