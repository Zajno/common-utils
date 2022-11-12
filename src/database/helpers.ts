/* eslint-disable no-console */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type * as _FirebaseAdmin from 'firebase-admin';
import type FirebaseClient from 'firebase/app';
import { IdentAny } from '@zajno/common/lib/ident';
import logger from '@zajno/common/lib/logger';
import DBProvider, {
    CollectionReference,
    DocumentData,
    DocumentReference,
    DocumentSnapshot,
    DocumentSnapshotCallback,
    DocumentSnapshotConverterCallback,
    Query,
    QuerySnapshot,
    QuerySnapshotCallback,
    QuerySnapshotConverterCallback,
    ServerFirestore,
    UnsubscribeSnapshot,
} from './dbProvider';

let LOG_DOCS_COUNT = true;
export function enableQueriesLogging(v: boolean) { LOG_DOCS_COUNT = v; }

export function serverOnly(provider: DBProvider, err = new Error('This method is server only')): ServerFirestore {
    if (provider.isClient === true) {
        throw err;
    }
    return provider;
}

let queryCounter = 0;
const logQueryCount = <T = DocumentData>(q: Query<T>, s: QuerySnapshot<T>, sub: boolean, name?: string) => LOG_DOCS_COUNT && logger.log(
    '[Firestore] ===> querySnapshot',
    sub ? '(SUB)' : '',
    s.size,
    (queryCounter += s.size),
    getQueryPath(q, name),
);

export function querySnapshot<T extends IdentAny>(db: DBProvider, query: Query<T>): Promise<T[]>;
export function querySnapshot<T extends IdentAny>(db: DBProvider, query: Query<T>,
    cb: QuerySnapshotCallback<T>): Promise<UnsubscribeSnapshot>;

export function querySnapshot<T extends IdentAny>(db: ServerFirestore, query: Query<T>,
        cb: QuerySnapshotCallback<T>): Promise<T[]>;

export function querySnapshot<T extends IdentAny>(db: DBProvider, query: Query<T>,
    cb: QuerySnapshotCallback<T>,
    converter: QuerySnapshotConverterCallback<T>): Promise<T[] | UnsubscribeSnapshot>;

export async function querySnapshot<T extends IdentAny>(
    db: DBProvider,
    query: Query<T>,
    cb: QuerySnapshotCallback<T> = null,
    converter: QuerySnapshotConverterCallback<T> = null,
    debugName?: string,
) {
    const convertSnapshots = (s: QuerySnapshot<T>): T[] => {
        const docs: DocumentSnapshot<T>[] = s.docs;

        if (converter) {
            const data = converter(docs);
            return data;
        } else {
            return docs.map((d) => {
                const cc = d.data();
                cc.id = d.id;
                return cc;
            });
        }
    };

    if (db.isClient === true && cb) {
        const firstFetchPromise: Promise<UnsubscribeSnapshot> = new Promise((resolveP, rejectP) => {
            let resolve = resolveP;
            const unsubscribe = query
                .onSnapshot(async (snapshot: QuerySnapshot<T>) => {
                    try {
                        logQueryCount(query, snapshot, true, debugName);

                        const items = convertSnapshots(snapshot);
                        await cb(items);
                    } finally {
                        if (resolve) {
                            const r = resolve;
                            resolve = null;
                            r(unsubscribe);
                        }
                    }

                }, (err: Error) => {
                    console.warn('querySnapshot fail:', getQueryPath(query));
                    console.error(err);
                    if (unsubscribe) {
                        unsubscribe();
                    }
                    rejectP(err);
                },
            );
        });

        const res = await firstFetchPromise;
        return res;
    } else {
        const snapshot = await query.get();
        logQueryCount(query, snapshot, false, debugName);

        return convertSnapshots(snapshot);
    }
}

let docsCounter = 0;
const logDocCount = <T>(doc: DocumentReference<T>, sub: boolean) => LOG_DOCS_COUNT && logger.log('[Firestore] ===> documentSnapshot', sub ? '(SUB)' : '', ++docsCounter, doc.path);

export function documentSnapshot<T extends IdentAny>(db: DBProvider, doc: DocumentReference<T>): Promise<T>;
export function documentSnapshot<T extends IdentAny>(db: DBProvider, doc: DocumentReference<T>,
    cb: DocumentSnapshotCallback<T>): Promise<T | UnsubscribeSnapshot>;
export function documentSnapshot<T extends IdentAny>(db: DBProvider, doc: DocumentReference<T>,
    cb: DocumentSnapshotCallback<T>,
    converter: DocumentSnapshotConverterCallback<T>): Promise<T | UnsubscribeSnapshot>;

export async function documentSnapshot<T extends IdentAny>(
    db: DBProvider,
    doc: DocumentReference<T>,
    cb: DocumentSnapshotCallback<T> = null,
    converter: DocumentSnapshotConverterCallback<T> = null,
): Promise<T | UnsubscribeSnapshot> {
    logDocCount(doc, db.isClient === true && cb != null);

    const convertSnapshot = (d: DocumentSnapshot<T>): T => {
        if (!d.exists) {
            return null;
        }

        if (converter) {
            const res = converter(d);
            return res;
        } else {
            const res = d.data();
            res.id = d.id;
            return res;
        }
    };

    if (db.isClient === true && cb) {

        const firstFetchPromise: Promise<UnsubscribeSnapshot> = new Promise((resolveP, rejectP) => {
            let resolve = resolveP;
            const unsubscribe = doc.onSnapshot(async (snapshot: DocumentSnapshot<T>) => {
                try {
                    const item = convertSnapshot(snapshot);
                    await cb(item);
                } catch (error) {
                    logger.error('ERROR IN DOCUMENT SNAPSHOT: ', 'PATH = ', (snapshot.ref.path) || '<path>', error);
                } finally {
                    if (resolve) {
                        const r = resolve;
                        resolve = null;
                        r(unsubscribe);
                    }
                }
            }, (err: Error) => {
                console.warn(`documentSnapshot fail: ${doc.path}`);
                console.error(err);
                if (unsubscribe) {
                    unsubscribe();
                }
                rejectP(err);
            });
        });

        const res = await firstFetchPromise;

        return res;
    } else {
        try {
            const snapshot = await doc.get();

            return convertSnapshot(snapshot);
        } catch (error) {
            logger.error('ERROR IN DOCUMENT SNAPSHOT: ', 'PATH = ', (doc.path) || '<path>', error);
        }
    }
}

function getQueryPath<T = any>(q: Query<T>, debugName: string = null) {
    return debugName || q.debugName || (q as CollectionReference<T>).path || `<${typeof q} ${q.constructor?.name}>`;
}

export function queryWhere<T, K extends (keyof T & string)>(q: Query<T>, key: K | string, op: FirebaseClient.firestore.WhereFilterOp, value: any): Query<T> {
    return q.where(key, op, value);
}
