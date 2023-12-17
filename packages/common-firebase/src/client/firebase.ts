import firebase from 'firebase/compat/app';
import type FirebaseApp from 'firebase/compat/app';
import { createLazy } from '@zajno/common/lazy/light';
import { assert } from '@zajno/common/functions/assert';

export { FirebaseApp };

import { createLogger } from '@zajno/common/logger/index';

import { ClientFirestore } from '../database/dbProvider';
import { IFunctionDefinition } from '../functions';
import { FunctionFactory } from './FunctionFactory';
import { FirebaseConfig } from '../config';
import { IFirestoreContext } from '../database';
import { ClientRealtimeDB, IDatabaseContext } from '../database/realtime';

let instance: firebase.app.App | null = null;
let firebaseConfig: FirebaseConfig | null = null;


type SettingsArgs = {
    functionsEmulator?: { url: string },
    firestore?: Pick<firebase.firestore.Settings, 'host' | 'ignoreUndefinedProperties'>,
    realtimeDatabaseEmulator?: { url: string },
    authEmulator?: { url: string },
    storageEmulator?: { url: string },
};

const DefaultSettings: SettingsArgs = { };

export type FirebaseSettings = Partial<typeof DefaultSettings> & {
    config: FirebaseConfig;
};

export type FirebaseUser = firebase.User;

const logger = createLogger('[Firebase]');

export function initializeFirebase(settings: FirebaseSettings) {
    if (!settings.config) {
        throw new Error('Firebase config should be present in "settings.config".');
    }

    // Your web app's Firebase configuration
    firebaseConfig = {
        ...settings.config,
    };

    Object.assign(DefaultSettings, settings);

    createApp();
}

function createApp() {
    if (instance || firebase.apps.length > 0) {
        logger.warn('Skipped creating the second instance of the app');
        return;
    }

    assert(!!firebaseConfig, 'Firebase config should be present');

    logger.log('Loading... API KEY =', firebaseConfig.apiKey);
    logger.log('Settings:', DefaultSettings);

    // Initialize Firebase
    instance = firebase.initializeApp(firebaseConfig);

    logger.log('Initialized successfully');
}

const auth = createLazy(() => {
    assert(!!instance, 'Firebase instance is not initialized');
    const auth = instance.auth();
    if (DefaultSettings.authEmulator?.url) {
        logger.log('Firebase Auth will use emulator:', DefaultSettings.authEmulator.url);
        auth.useEmulator(DefaultSettings.authEmulator.url);
    }
    return auth;
});

const functions = createLazy(() => {
    assert(!!instance, 'Firebase instance is not initialized');
    const fns = instance.functions() as ReturnType<typeof firebase.functions> & {
        create<TArg, TResult>(definition: IFunctionDefinition<TArg, TResult>): FunctionFactory<TArg, TResult>;
    };

    const { functionsEmulator } = DefaultSettings;
    if (functionsEmulator?.url) {
        const { hostname, port } = new URL(functionsEmulator.url);
        logger.log('Firebase functions will use emulator:', functionsEmulator.url, '=>', hostname, port);
        fns.useEmulator(hostname, +port);
    }

    fns.create = function getFunction<TArg, TResult>(definition: IFunctionDefinition<TArg, TResult>) {
        return new FunctionFactory<TArg, TResult>(definition, fns);
    };

    return fns;
});

const database = createLazy<ClientFirestore>(() => {
    assert(!!instance, 'Firebase instance is not initialized');
    const db = instance.firestore() as ClientFirestore;

    if (DefaultSettings.firestore) {
        const settings: firebase.firestore.Settings = { ...DefaultSettings.firestore };
        if (settings.host) {
            logger.log('Firestore will use emulator: ', settings.host);
            settings.ssl = false;
        }
        db.settings(settings);
    }
    db.isClient = true;
    return db;
});

const realtimeDatabase = createLazy(() => {

    assert(!!instance, 'Firebase instance is not initialized');
    const rdb = instance.database();

    const emulator = DefaultSettings.realtimeDatabaseEmulator;
    if (emulator?.url) {
        const { hostname, port } = new URL(emulator.url);
        logger.log('Firebase Realtime Database will use emulator:', emulator.url, '=>', hostname, port);
        rdb.useEmulator(hostname, +port);
    }

    return rdb;
});

const storage = createLazy(() => {
    assert(!!instance, 'Firebase instance is not initialized');
    const storageInstance = instance.storage();

    const emulator = DefaultSettings.storageEmulator;
    if (emulator?.url) {
        const { hostname, port } = new URL(emulator.url);
        logger.log('Firebase Storage will use emulator:', emulator.url, '=>', hostname, port);
        storageInstance.useEmulator(hostname, +port);
    }

    return storageInstance;
});

const wrapper = {
    get config(): Readonly<FirebaseConfig> | null { return firebaseConfig; },

    get auth() { return auth.value; },
    get functions() { return functions.value; },
    get database() { return database.value; },
    get realtimeDatabase() { return realtimeDatabase.value; },
    get storage() { return storage.value; },

    types: {
        get FirebaseAuth(): Readonly<typeof firebase.auth> { return firebase.auth; },
        get Firestore(): Readonly<typeof firebase.firestore> { return firebase.firestore; },
        get RealtimeDatabase(): Readonly<typeof firebase.database> { return firebase.database; },
        get FirebaseStorage(): Readonly<typeof firebase.storage> { return firebase.storage; },
    },

    get raw() { return firebase; },
};

const Firebase = {
    get Instance(): Readonly<typeof wrapper> {
        if (!instance) {
            throw new Error('Firebase: run initializeAsync before accessing Firebase instance');
        }

        // TODO allow to recreate app if firebaseConfig is present?

        return wrapper;
    },

    async destroy() {
        if (!instance) {
            return;
        }

        if (database.hasValue) {
            await database.value.terminate();
            await database.value.clearPersistence();
        }

        [auth, functions, database, realtimeDatabase, storage].forEach(lazy => {
            if (lazy.hasValue) {
                lazy.reset();
            }
        });

        await instance.delete();
        instance = null;
    },
} as const;

export const FirestoreContext: IFirestoreContext<ClientFirestore> = {
    get db() { return Firebase.Instance.database; },
    get FieldValue() { return Firebase.Instance.types.Firestore.FieldValue; },
    get FieldPath() { return Firebase.Instance.types.Firestore.FieldPath; },
    get Timestamp() { return Firebase.Instance.types.Firestore.Timestamp; },
};

export const DatabaseContext: IDatabaseContext<ClientRealtimeDB> = {
    get db() { return Firebase.Instance.realtimeDatabase; },
    get ServerValue() { return Firebase.Instance.types.RealtimeDatabase.ServerValue; },
};

export default Firebase;
