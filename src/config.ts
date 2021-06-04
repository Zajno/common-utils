
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

let appConfig: FirebaseConfig = null;

export function setAppConfig(config: FirebaseConfig) {
    appConfig = config;
}

export const AppConfig = {
    get value() { return appConfig; },
};
