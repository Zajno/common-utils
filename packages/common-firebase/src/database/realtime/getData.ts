import { DocumentSnapshotCallback, UnsubscribeSnapshot } from '../types';
import { IReference } from './types';

export function getData<T = any>(ref: IReference): Promise<T>;
export function getData<T = any>(ref: IReference, cb: DocumentSnapshotCallback<T>): Promise<UnsubscribeSnapshot>;

export async function getData<T = any>(ref: IReference, cb?: DocumentSnapshotCallback<T>): Promise<T | UnsubscribeSnapshot> {
    if (!cb) {
        const snapshot = await ref.get<T>();
        return snapshot.val();
    }

    // This is made to make sure first value has been read & returned before we return (resolve) a unsubscribe callback
    let firstFetch = true;
    return new Promise<UnsubscribeSnapshot>((resolve, reject) => {
        const unsub = ref.onValue<T>(async (snapshot) => {
            const value = snapshot.val();
            await cb(value);

            if (firstFetch) {
                resolve(unsub);
                firstFetch = false;
            }
        }, reject);
    });

    // TODO add error handling and 'once' implementation
}
