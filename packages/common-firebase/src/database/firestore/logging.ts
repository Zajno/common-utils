import { LoggerProvider } from '@zajno/common/logger/loggable.js';
import { ILoggerFactory } from '@zajno/common/logger/types.js';

export const FirestoreLogging = new LoggerProvider();

export function enableFirestoreLogging(factory: ILoggerFactory) {
    FirestoreLogging.setLoggerFactory(factory, '[Firestore]');
}
