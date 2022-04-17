import * as functions from 'firebase-functions';
import { FunctionsErrorCode } from 'firebase-functions/lib/providers/https';

namespace AppHttpError {
    export type InvalidArgDescription<T = any> = {
        name: keyof T,
        expected?: string;
        got?: string;
        error?: string;
    };

    export enum ErrorCodes {
        InvalidArguments = 'invalid-argument',
        Unauthenticated = 'unauthenticated',
        NotFound = 'not-found',
        AlreadyExists = 'already-exists',
        PreconditionFailed = 'failed-precondition',
        Internal = 'internal',
        NoPermission = 'permission-denied',
        Unknown = 'unknown'
    }

    export const DefaultStrings: Partial<Record<functions.https.FunctionsErrorCode, string>> = {
        [ErrorCodes.InvalidArguments]: 'Invalid arguments',
        [ErrorCodes.Unauthenticated]: 'This action requires authentication',
        [ErrorCodes.NotFound]: 'Not found',
        [ErrorCodes.AlreadyExists]: 'The items already exists',
        [ErrorCodes.PreconditionFailed]: 'Precondition failed',
        [ErrorCodes.Internal]: 'Internal error',
        [ErrorCodes.NoPermission]: 'Incorrect permissions',
        [ErrorCodes.Unknown]: 'Unknown error',
    };

    export function Construct(code: ErrorCodes | FunctionsErrorCode, message: string, details: unknown = undefined) {
        return new functions.https.HttpsError(code, message || DefaultStrings[code], details);
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

        return new functions.https.HttpsError('invalid-argument', message, { list });
    }

    export function NotAuthenticated(message?: string, details: unknown = undefined) {
        return new functions.https.HttpsError('unauthenticated', message || DefaultStrings.unauthenticated, details);
    }

    export function NotFound(message?: string, details: unknown = undefined) {
        return new functions.https.HttpsError('not-found', message || DefaultStrings['not-found'], details);
    }

    export function AlreadyExists(message?: string, details: unknown = undefined) {
        return new functions.https.HttpsError('already-exists', message || DefaultStrings['already-exists'], details);
    }

    export function PreconditionFailed(message?: string, details: unknown = undefined) {
        return new functions.https.HttpsError('failed-precondition', message || DefaultStrings['failed-precondition'], details);
    }

    export function Internal(message?: string, details: unknown = undefined) {
        return new functions.https.HttpsError('internal', message || DefaultStrings.internal, details);
    }

    export function NoPermission(message?: string, details: unknown = undefined) {
        return new functions.https.HttpsError('permission-denied', message || DefaultStrings['permission-denied'], details);
    }

    export function Unknown(message?: string, details: unknown = undefined) {
        return new functions.https.HttpsError('unknown', message || DefaultStrings.unknown, details);
    }
}

export default AppHttpError;
