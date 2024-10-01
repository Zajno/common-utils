import { FirebaseApp, createFirebaseLazy, logger } from '../app';
import {
    FirestoreSettings,
    initializeFirestore,
    getFirestore,
} from 'firebase/firestore';

export const Firestore = createFirebaseLazy(() => {
    try {
        if (FirebaseApp.Settings) {
            const settings: FirestoreSettings = { ...FirebaseApp.Settings.firestore };
            if (settings.host) {
                logger.log('Firestore will use emulator: ', settings.host);
                settings.ssl = false;
            }

            initializeFirestore(FirebaseApp.Current, settings);
        }

        // logger.log('creating Firestore... for app = ', FirebaseApp.Current.options.projectId);
        const db = getFirestore(FirebaseApp.Current);
        return db;
    } catch (err) {
        logger.error('Failed to create Firestore:', err);
        return null!; // TODO better re-throw?
    }
});
