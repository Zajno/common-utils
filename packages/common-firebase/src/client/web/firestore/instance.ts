import { FirebaseApp, createFirebaseLazy } from '../app.js';
import {
    type FirestoreSettings,
    initializeFirestore,
    getFirestore,
} from 'firebase/firestore';

export const Firestore = createFirebaseLazy(() => {
    try {
        if (FirebaseApp.Settings) {
            const settings: FirestoreSettings = { ...FirebaseApp.Settings.firestore };
            if (settings.host) {
                FirebaseApp.logger?.log('Firestore will use emulator: ', settings.host);
                settings.ssl = false;
            }

            initializeFirestore(FirebaseApp.Current, settings);
        }

        const databaseId = FirebaseApp.Settings?.config?.firestoreDatabaseId || undefined;

        FirebaseApp.logger?.log('creating Firestore... for app = ', FirebaseApp.Current.options.projectId, '; databaseId = ', databaseId);
        if (databaseId) {
            return getFirestore(FirebaseApp.Current, databaseId);
        }

        return getFirestore(FirebaseApp.Current);
    } catch (err) {
        FirebaseApp.logger?.error('Failed to create Firestore:', err);
        return null!; // TODO better re-throw?
    }
});
