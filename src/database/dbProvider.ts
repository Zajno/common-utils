import type FirebaseClient from 'firebase/app';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type * as FirebaseAdmin from 'firebase-admin';
import Identify from '../Ident';
import logger from '@zajno/common/lib/logger';

/* global FirebaseFirestore */

export type ClientFirestore = FirebaseClient.firestore.Firestore & { isClient: true };
export type ServerFirestore = FirebaseFirestore.Firestore & { isClient: false };

type DBProvider = ClientFirestore | ServerFirestore;

export type Query = FirebaseClient.firestore.Query | FirebaseFirestore.Query;
export type QuerySnapshot = FirebaseClient.firestore.QuerySnapshot | FirebaseFirestore.QuerySnapshot;
export type DocumentSnapshot = FirebaseClient.firestore.DocumentSnapshot | FirebaseFirestore.DocumentSnapshot;
export type QueryDocumentSnapshot = FirebaseClient.firestore.QueryDocumentSnapshot | FirebaseFirestore.QueryDocumentSnapshot;
export type DocumentReference = FirebaseClient.firestore.DocumentReference | FirebaseFirestore.DocumentReference;

export type CollectionReference = FirebaseClient.firestore.CollectionReference | FirebaseFirestore.CollectionReference;

let LOG_DOCS_COUNT = true;
export function enableQueriesLogging(v: boolean) { LOG_DOCS_COUNT = v; }

export function serverOnly(provider: DBProvider, err = new Error('This method is server only')): ServerFirestore {
    if (provider.isClient === true) {
        throw err;
    }
    return provider;
}

export type QuerySnapshotCallback<T> = (items: T[]) => void;
export type QuerySnapshotConverterCallback<T> = (items: DocumentSnapshot[]) => T[];
export type DocumentSnapshotConverterCallback<T> = (item: DocumentSnapshot) => T;
export type DocumentSnapshotCallback<T> = (item: T) => void | Promise<void>;

export type UnsubscribeSnapshot = () => void;
type AnyIded = Identify<{ }>;

let queryCounter = 0;
const logQueryCount = (q: Query, s: QuerySnapshot) => LOG_DOCS_COUNT && logger.log(' ===> querySnapshot', s.size, (queryCounter += s.size), getQueryPath(q));

export function querySnapshot<T extends AnyIded>(db: DBProvider, query: Query): Promise<T[]>;
export function querySnapshot<T extends AnyIded>(db: DBProvider, query: Query,
    cb: QuerySnapshotCallback<T>): Promise<T[] | UnsubscribeSnapshot>;
export function querySnapshot<T extends AnyIded>(db: DBProvider, query: Query,
    cb: QuerySnapshotCallback<T>,
    converter: QuerySnapshotConverterCallback<T>): Promise<T[] | UnsubscribeSnapshot>;

export async function querySnapshot<T extends AnyIded>(
    db: DBProvider,
    query: Query,
    cb: QuerySnapshotCallback<T> = null,
    converter: QuerySnapshotConverterCallback<T> = null,
) {
    const convertSnapshots = (s: QuerySnapshot): T[] => {
        const docs: DocumentSnapshot[] = s.docs;

        if (converter) {
            const data = converter(docs);
            return data;
        } else {
            return docs.map((d) => {
                const cc = d.data() as T & AnyIded;
                cc.id = d.id;
                return cc;
            });
        }
    };

    if (db.isClient === true && cb) {
        const firstFetchPromise: Promise<UnsubscribeSnapshot> = new Promise(resolveP => {
            let resolve = resolveP;
            const unsubscribe = query
                .onSnapshot(async (snapshot: QuerySnapshot) => {
                    try {
                        logQueryCount(query, snapshot);

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
                    /* eslint-disable no-console */
                    console.warn(`querySnapshot fail: ${getQueryPath(query)}`);
                    console.error(err);
                },
                );
        });

        const res = await firstFetchPromise;
        return res;
    } else {
        const snapshot = await query.get();
        logQueryCount(query, snapshot);

        return convertSnapshots(snapshot);
    }
}

let docsCounter = 0;
const logDocCount = (doc: DocumentReference) => LOG_DOCS_COUNT && logger.log(' ===> documentSnapshot', ++docsCounter, doc.path);

export function documentSnapshot<T extends AnyIded>(db: DBProvider, doc: DocumentReference): Promise<T>;
export function documentSnapshot<T extends AnyIded>(db: DBProvider, doc: DocumentReference,
    cb: DocumentSnapshotCallback<T>): Promise<T | UnsubscribeSnapshot>;
export function documentSnapshot<T extends AnyIded>(db: DBProvider, doc: DocumentReference,
    cb: DocumentSnapshotCallback<T>,
    converter: DocumentSnapshotConverterCallback<T>): Promise<T | UnsubscribeSnapshot>;

export async function documentSnapshot<T extends AnyIded>(
    db: DBProvider,
    doc: DocumentReference,
    cb: DocumentSnapshotCallback<T> = null,
    converter: DocumentSnapshotConverterCallback<T> = null,
): Promise<T | UnsubscribeSnapshot> {
    logDocCount(doc);

    const convertSnapshot = (d: DocumentSnapshot): T => {
        if (!d.exists) {
            return null;
        }

        if (converter) {
            const res = converter(d);
            return res;
        } else {
            const res = d.data() as T & AnyIded;
            res.id = d.id;
            return res;
        }
    };

    if (db.isClient === true && cb) {

        const firstFetchPromise: Promise<UnsubscribeSnapshot> = new Promise(resolveP => {
            let resolve = resolveP;
            const unsub = doc.onSnapshot(async (snapshot: DocumentSnapshot) => {
                try {
                    const item = convertSnapshot(snapshot);
                    await cb(item);
                } catch (error) {
                    logger.error('ERROR IN DOCUMENT SNAPSHOT: ', 'PATH = ', (snapshot.ref.path) || '<path>', error);
                } finally {
                    if (resolve) {
                        const r = resolve;
                        resolve = null;
                        r(unsub);
                    }
                }
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

function getQueryPath(q: Query) {
    return (q as CollectionReference).path || '<query>';
}

export default DBProvider;
