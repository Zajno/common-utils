import { FirebaseApp, createFirebaseLazy, logger } from '../app.js';
import {
    connectAuthEmulator,
    getAuth,
} from 'firebase/auth';

export const Auth = createFirebaseLazy(() => {
    const auth = getAuth(FirebaseApp.Current);

    if (FirebaseApp.Settings.authEmulator?.url) {
        logger.log('Firebase Auth will use emulator:', FirebaseApp.Settings.authEmulator.url);
        connectAuthEmulator(auth, FirebaseApp.Settings.authEmulator.url);
    }

    return auth;
});
