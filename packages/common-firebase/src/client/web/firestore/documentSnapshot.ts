/* eslint-disable no-console */
import type { IdentAny } from '@zajno/common/types/ident';
import logger from '@zajno/common/logger';
import {
    DocumentReference,
    DocumentSnapshot,
    getDoc,
    onSnapshot,
} from 'firebase/firestore';
import {
    DocumentSnapshotCallback,
    logDocCount,
    UnsubscribeSnapshot,
} from '../../../database/firestore/index.js';
import { wrapAsync } from '@zajno/common/functions/safe';
import { Nullable } from '@zajno/common/types';

export type DocumentSnapshotConverterCallback<T> = (item: DocumentSnapshot<T>) => T;

export function documentSnapshot<T extends IdentAny>(doc: DocumentReference<T>): Promise<T>;
export function documentSnapshot<T extends IdentAny>(doc: DocumentReference<T>,
    cb: DocumentSnapshotCallback<T>): Promise<T | UnsubscribeSnapshot>;
export function documentSnapshot<T extends IdentAny>(doc: DocumentReference<T>,
    cb: DocumentSnapshotCallback<T>,
    converter: DocumentSnapshotConverterCallback<T>): Promise<T | UnsubscribeSnapshot>;

export async function documentSnapshot<T extends IdentAny>(
    doc: DocumentReference<T>,
    cb?: DocumentSnapshotCallback<T | null>,
    converter?: DocumentSnapshotConverterCallback<T>,
): Promise<Nullable<T> | UnsubscribeSnapshot> {
    logDocCount(doc, cb != null);

    const convertSnapshot = (d: DocumentSnapshot<T>): T | null => {
        if (!d.exists()) {
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

    if (cb) {
        const firstFetchPromise: Promise<UnsubscribeSnapshot> = new Promise((resolveP, rejectP) => {
            let resolve: Nullable<typeof resolveP> = resolveP;
            const unsubscribe = onSnapshot(
                doc,
                wrapAsync(
                    async (snapshot: DocumentSnapshot<T>) => {
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
                    },
                ),
                (err: Error) => {
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
            const snapshot = await getDoc(doc);

            return convertSnapshot(snapshot);
        } catch (error) {
            logger.error('ERROR IN DOCUMENT SNAPSHOT: ', 'PATH = ', (doc.path) || '<path>', error);
            return undefined;
        }
    }
}
