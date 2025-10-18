import type { ILogger } from '@zajno/common/logger';
import type { FirebaseConfig } from '../../config.js';
import type { Nullable } from '@zajno/common/types/misc.js';

const EmptyAppSettings = {
    functionsEmulator: null! as { url: string },
    firestore: null! as {
        host: Nullable<string>,
        ignoreUndefinedProperties?: boolean,
        experimentalForceLongPolling?: boolean,
        experimentalAutoDetectLongPolling?: boolean,
    },
    realtimeDatabaseEmulator: null! as { url: string },
    authEmulator: null! as { url: string },
    storageEmulator: null! as { url: string },
};

export type AppSettings = typeof EmptyAppSettings;

export type FirebaseSettings = Partial<AppSettings> & {
    config: FirebaseConfig;
};

export namespace FirebaseSettings {
    export const Empty = EmptyAppSettings;
}

export interface IFirebaseApp<TApp> {
    readonly Current: TApp;
    readonly Settings: Readonly<FirebaseSettings>;

    readonly logger: ILogger | null;

    destroy(): void;
}
