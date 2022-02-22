import * as functions from 'firebase-functions';
import { FunctionsErrorCode } from 'firebase-functions/lib/providers/https';

namespace AppHttpError {
    export type InvalidArgDescription<T = any> = {
        name: keyof T,
        expected?: string;
        got?: string;
        error?: string;
    };

    export const DefaultStrings: Partial<Record<functions.https.FunctionsErrorCode, string>> = {
        'invalid-argument': 'Invalid arguments',
        unauthenticated: 'This action requires authentication',
        'not-found': 'Not found',
        'already-exists': 'The items already exists',
        'failed-precondition': 'Precondition failed',
        'internal': 'Internal error',
        'permission-denied': 'Incorrect permissions',
    };

    export function Construct(code: FunctionsErrorCode, message: string) {
        return new functions.https.HttpsError(code, message || DefaultStrings[code]);
    }

    export function InvalidArguments<T = any>(...list: InvalidArgDescription<T>[]) {
        if (!list?.length) {
            return new functions.https.HttpsError('invalid-argument', DefaultStrings['invalid-argument']);
        }

        const strings = list.map(arg => {
            const details = [
                arg.expected ? `expected: ${arg.expected}` : null,
                arg.got ? `got: ${arg.got}` : null,
                arg.error ? `error: ${arg.error}` : null,
            ].filter(d => d);
            const detailsStr = details.length > 0
                ? ` (${details.join(', ')})`
                : '';
            return `${arg.name}${detailsStr}`;
        });
        const message = `Expected fields: ${strings.join(', ')}`;

        return new functions.https.HttpsError('invalid-argument', message);
    }

    export function NotAuthenticated(message?: string) {
        return new functions.https.HttpsError('unauthenticated', message || DefaultStrings.unauthenticated);
    }

    export function NotFound(message?: string) {
        return new functions.https.HttpsError('not-found', message || DefaultStrings['not-found']);
    }

    export function AlreadyExists(message?: string) {
        return new functions.https.HttpsError('already-exists', message || DefaultStrings['already-exists']);
    }

    export function PreconditionFailed(message?: string) {
        return new functions.https.HttpsError('failed-precondition', message || DefaultStrings['failed-precondition']);
    }

    export function Internal(message?: string) {
        return new functions.https.HttpsError('internal', message || DefaultStrings.internal);
    }

    export function NoPermission(message?: string) {
        return new functions.https.HttpsError('permission-denied', message || DefaultStrings['permission-denied']);
    }

    export function Unknown(message?: string) {
        return new functions.https.HttpsError('unknown', message || DefaultStrings.unknown);
    }
}

export default AppHttpError;
