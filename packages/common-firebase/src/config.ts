
export type FirebaseConfig = {
    apiKey?: string;
    appId: string;
    authDomain: string;
    projectId: string;

    /** Firestore Database ID, `(default)` by default */
    firestoreDatabaseId?: string;

    /** Realtime Database URL */
    databaseURL?: string;

    storageBucket: string;

    messagingSenderId?: string;

    measurementId?: string;
};
