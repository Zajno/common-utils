import { FirebaseApp, createFirebaseLazy } from '../app.js';
import {
    type FirestoreSettings,
    initializeFirestore,
} from 'firebase/firestore';

export const Firestore = createFirebaseLazy(() => {
    try {
        const settings: FirestoreSettings = { ...FirebaseApp.Settings?.firestore };
        if (settings.host) {
            FirebaseApp.logger?.log('Firestore will use emulator: ', settings.host);
            settings.ssl = false;
        }

        const databaseId = FirebaseApp.Settings?.config?.firestoreDatabaseId || undefined;
        FirebaseApp.logger?.log('creating Firestore... for app = ', FirebaseApp.Current.options.projectId, '; databaseId = ', databaseId, '; settings = ', settings);

        return initializeFirestore(FirebaseApp.Current, settings, databaseId);
    } catch (err) {
        FirebaseApp.logger?.error('Failed to create Firestore:', err);
        return null!; // TODO better re-throw?
    }
});
