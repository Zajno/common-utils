import { createLogger } from '@zajno/common/logger';
import { FirebaseSettings, IFirebaseApp } from '../abstractions/app.js';
import { initializeApp, FirebaseApp as FirebaseAppType, deleteApp } from 'firebase/app';
import { Lazy } from '@zajno/common/lazy';
import { assert } from '@zajno/common/functions/assert';

let _instance: FirebaseAppType | null = null;
let _settings: FirebaseSettings | null = null;

export const logger = createLogger('[Firebase]');

export function initializeFirebase(settings: FirebaseSettings) {
    if (!settings.config) {
        throw new Error('Firebase config should be present in "settings.config".');
    }

    _settings = Object.assign({ ...FirebaseSettings.Empty }, settings);
    _settings.config = { ...settings.config };

    createApp();
}

function createApp() {
    if (_instance || !_settings) {
        logger.warn('Skipped creating the second instance of the app');
        return;
    }

    logger.log('Loading... API KEY =', _settings.config.apiKey);
    logger.log('Settings:', _settings);

    // Initialize Firebase
    _instance = initializeApp(_settings.config);

    logger.log('Initialized successfully');
}


export const FirebaseApp: IFirebaseApp<FirebaseAppType> = {
    get Current() {
        assert(!!_instance, 'Firebase app is not initialized');
        return _instance;
    },
    get Settings() {
        assert(!!_settings, 'Firebase app is not initialized');
        return _settings;
    },

    destroy() {
        if (_instance) {
            deleteApp(_instance);
            _instance = null;
        }
    },
};

export interface IFirebaseAppModule {
    readonly app: FirebaseAppType;
}

export class FirebaseLazy<T extends IFirebaseAppModule> extends Lazy<T> {
    get isValid() {
        return super.isValid && _instance && _instance === this._instance?.app || false;
    }
}

export function createFirebaseLazy<T extends IFirebaseAppModule>(creator: () => T, disposer?: (instance: T) => void) {
    const res = new FirebaseLazy(creator);
    if (disposer) {
        res.withDisposer(disposer);
    }
    return res;
}
