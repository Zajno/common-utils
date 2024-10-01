
export type FirebaseConfig = {
    apiKey?: string,
    appId: string,
    authDomain: string,
    projectId: string,
    databaseURL: string,
    storageBucket: string,
    messagingSenderId?: string,
    measurementId?: string,
};

let appConfig: FirebaseConfig | null = null;

/** Singleton storage for a client/server Firebase App config
 *
 * @deprecated Is not used within this library so it's better to have your own one only if needed */
export const AppConfig = {
    get value() { return appConfig; },

    setCurrent(config: FirebaseConfig) {
        appConfig = config;
    },
};
