import { LoggerProvider, type ILoggerFactory } from '@zajno/common/logger';

export const FirestoreLogging = new LoggerProvider();

export function enableFirestoreLogging(factory: ILoggerFactory) {
    FirestoreLogging.setLoggerFactory(factory, '[Firestore]');
}
