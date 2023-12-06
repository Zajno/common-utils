import type FirebaseClient from 'firebase/compat/app';
import type * as FirebaseAdmin from 'firebase-admin';

import { DocumentSnapshotCallback, UnsubscribeSnapshot } from '../dbProvider';

export type ClientRealtimeDB = FirebaseClient.database.Database;
export type ServerRealtimeDB = FirebaseAdmin.database.Database;

export type RealtimeDBProvider = ClientRealtimeDB | ServerRealtimeDB;

export type DatabaseServerValue = typeof FirebaseClient.database.ServerValue | typeof FirebaseAdmin.database.ServerValue;

export type Reference = FirebaseClient.database.Reference | FirebaseAdmin.database.Reference;

type DataSnapshot = FirebaseClient.database.DataSnapshot | FirebaseAdmin.database.DataSnapshot;

export type { DocumentSnapshotCallback, UnsubscribeSnapshot };

export function getData<T = any>(ref: Reference): Promise<T>;
export function getData<T = any>(ref: Reference, cb: DocumentSnapshotCallback<T>): Promise<UnsubscribeSnapshot>;

export async function getData<T = any>(ref: Reference, cb?: DocumentSnapshotCallback<T>) {
    if (!cb) {
        const snapshot = await ref.get();
        return snapshot.val();
    }

    let firstFetch = true;
    return new Promise<UnsubscribeSnapshot>((resolve, reject) => {
        const listener = ref.on('value', async (snapshot: DataSnapshot) => {
            const value = snapshot.val();
            await cb(value);

            if (firstFetch) {
                resolve(() => ref.off('value', listener));
                firstFetch = false;
            }
        }, reject);
    });
}

export interface IDatabaseContext<DB extends RealtimeDBProvider = RealtimeDBProvider> {
    readonly db: DB;
    readonly ServerValue: DatabaseServerValue;
}
