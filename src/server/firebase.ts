import { createLazy } from '@zajno/common/lib/lazy/light';
import { IDatabaseContext, ServerRealtimeDB } from '../database/realtime';
import { IFirestoreContext, ServerFirestore } from '../database';
import Admin, { AdminLib } from './admin';
import { AppConfig } from '../config';

const FirestoreDb = createLazy(() => {
    const firestoreDb: ServerFirestore = Admin.firestore() as ServerFirestore;
    firestoreDb.isClient = false;
    return firestoreDb;
});

const RealtimeDb = createLazy(() => {
    return Admin.database(AppConfig.value.databaseURL);
});

const storage = Admin.storage();
const StorageBucket = createLazy(() => {
    const bucketName = AppConfig.value?.storageBucket || storage.bucket().name;
    const bucket: ReturnType<typeof storage.bucket> = storage.bucket(bucketName);
    return bucket;
});

export const FirestoreContext: IFirestoreContext<ServerFirestore> = {
    get db() { return FirestoreDb.value; },
    get FieldValue() { return AdminLib.firestore.FieldValue; },
    get FieldPath() { return AdminLib.firestore.FieldPath; },
    get Timestamp() { return AdminLib.firestore.Timestamp; },
};

export const DatabaseContext: IDatabaseContext<ServerRealtimeDB> = {
    get db() { return RealtimeDb.value; },
    get ServerValue() { return AdminLib.database.ServerValue; },
};

export const StorageContext = {
    get storage() { return storage; },
    get bucket() { return StorageBucket.value; },
};
