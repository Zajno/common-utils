import { FirebaseSettings, type IFirebaseApp } from '../abstractions/app.js';
import { initializeApp, type FirebaseApp as FirebaseAppType, deleteApp } from 'firebase/app';
import { Lazy } from '@zajno/common/lazy';
import { assert } from '@zajno/common/functions/assert';
import { LoggerProvider, type ILoggerFactory } from '@zajno/common/logger';

let _instance: FirebaseAppType | null = null;
let _settings: FirebaseSettings | null = null;

const Logger = new LoggerProvider();

export function setLoggerFactory(loggerFactory: ILoggerFactory | undefined | null) {
    if (loggerFactory) {
        Logger.setLoggerFactory(loggerFactory, '[Firebase]');
    }
}

export function initializeFirebase(
    settings: FirebaseSettings,
    loggerFactory?: ILoggerFactory,
) {
    if (!settings.config) {
        throw new Error('Firebase config should be present in "settings.config".');
    }

    setLoggerFactory(loggerFactory);

    _settings = Object.assign({ ...FirebaseSettings.Empty }, settings);
    _settings.config = { ...settings.config };

    createApp();
}

function createApp() {
    if (_instance || !_settings) {
        Logger.logger?.warn('Skipped creating the second instance of the app');
        return;
    }

    Logger.logger?.log('Loading... API KEY =', _settings.config.apiKey);
    Logger.logger?.log('Settings:', _settings);

    // Initialize Firebase
    _instance = initializeApp(_settings.config);

    Logger.logger?.log('Initialized successfully');
}


export const FirebaseApp: IFirebaseApp<FirebaseAppType> = {
    get logger() {
        return Logger.logger;
    },

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
