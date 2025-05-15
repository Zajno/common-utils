import { FirebaseApp, createFirebaseLazy } from './app.js';
import {
    getDatabase,
    connectDatabaseEmulator,
} from 'firebase/database';

export const RealtimeDatabase = createFirebaseLazy(() => {
    const emulator = FirebaseApp.Settings.realtimeDatabaseEmulator;

    const rtdb = getDatabase(FirebaseApp.Current);

    if (emulator?.url) {
        const { hostname, port } = new URL(emulator.url);
        FirebaseApp.logger?.log('Firebase Realtime Database will use emulator:', emulator.url, '=>', hostname, port);
        connectDatabaseEmulator(rtdb, hostname, +port);
    }

    return rtdb;
});
