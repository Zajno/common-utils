
export type FirebaseConfig = {
    apiKey?: string,
    authDomain: string,
    projectId: string,
    databaseURL: string,
    storageBucket: string,
    messagingSenderId: string,
    appId: string,
};

let appConfig: FirebaseConfig = null;

export function setAppConfig(config: FirebaseConfig) {
    appConfig = config;
}

export const AppConfig = {
    get value() { return appConfig; },
};
