import firebase from 'firebase/app';
import type FirebaseApp from 'firebase/app';
import Lazy from '@zajno/common/lib/lazy';

export { FirebaseApp };

import { createLogger } from '@zajno/common/lib/logger';

import { ClientFirestore } from '../database/dbProvider';
import { FunctionDefinition } from '../abstractions/functions';
import { FunctionFactory } from './FunctionFactory';
import { FirebaseConfig } from '../config';

let instance: firebase.app.App = null;
let firebaseConfig: FirebaseConfig = null;

const Settings = {
    functionsEmulator: null as { host: string, port: number },
    firestore: null as Pick<firebase.firestore.Settings, 'host' | 'ignoreUndefinedProperties'>,
};

export type FirebaseSettings = Partial<typeof Settings> & {
    config: FirebaseConfig;
};

export type FirebaseUser = firebase.User;

const logger = createLogger('[Firebase]');

export function initializeAsync(settings: FirebaseSettings) {
    if (firebase.apps.length > 0) {
        logger.warn('Skipped creating the second instance of the app');
        return;
    }

    // logger.log('FIREBASE CONFIG', settings.config);
    if (!settings.config) {
        throw new Error('Firebase config should be present in "settings.config".');
    }

    // Your web app's Firebase configuration
    firebaseConfig = {
        ...settings.config,
    };

    logger.log('Loading... API KEY =', firebaseConfig.apiKey);

    Object.assign(Settings, settings);
    logger.log('Settings:', Settings);

    // Initialize Firebase
    instance = firebase.initializeApp(firebaseConfig);

    logger.log('Initialized successfully');
}

const auth = new Lazy(() => {
    require('firebase/auth');
    return instance.auth();
});

const functions = new Lazy(() => {
    require('firebase/functions');

    const fns = instance.functions();

    const { functionsEmulator } = Settings;
    if (functionsEmulator) {
        logger.log('Firebase functions will use emulator:', functionsEmulator);
        fns.useEmulator(functionsEmulator.host, functionsEmulator.port);
    }

    return fns;
});

const database = new Lazy<ClientFirestore>(() => {
    require('firebase/firestore');

    const db = instance.firestore() as ClientFirestore;

    if (Settings.firestore) {
        const settings: firebase.firestore.Settings = { ...Settings.firestore };
        if (settings.host) {
            logger.log('Firestore will use emulator: ', settings.host);
            settings.ssl = false;
        }
        db.settings(settings);
    }
    db.isClient = true;
    return db;
});

const storage = new Lazy(() => {
    require('firebase/storage');
    return instance.storage();
});

const wrapper = {
    get config(): Readonly<FirebaseConfig> { return firebaseConfig; },

    get auth() { return auth.value; },
    get functions() { return functions.value; },
    get database() { return database.value; },
    get storage() { return storage.value; },

    get GoogleProvider() { return firebase.auth.GoogleAuthProvider; },

    get FirebaseAuth() { return firebase.auth; },

    getFunction<TArg, TResult>(definition: FunctionDefinition<TArg, TResult>) {
        return new FunctionFactory<TArg, TResult>(definition, wrapper.functions);
    },

    get StorageEvent() { return firebase.storage.TaskEvent.STATE_CHANGED; },
};

export default {
    get Instance() {
        if (!instance) {
            throw new Error('Firebase: run initializeAsync before accessing Firebase instance');
        }
        return wrapper;
    },
};
