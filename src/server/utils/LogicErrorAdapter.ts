import * as functions from 'firebase-functions';
import LogicError from '../../database/LogicError';

export function toHttpError(this: LogicError) {
    let code: functions.https.FunctionsErrorCode;
    switch (this.type) {
        case LogicError.Types.InvalidArgs: {
            code = 'invalid-argument';
            break;
        }

        case LogicError.Types.AlreadyExists: {
            code = 'already-exists';
            break;
        }

        default: {
            code = 'unknown';
            break;
        }
    }
    const res = new functions.https.HttpsError(code, this.message);
    res.stack = this.stack;
    return res;
}

export function tryConvertToHttpError<T extends Error = Error>(err: T): functions.https.HttpsError {
    if (err instanceof functions.https.HttpsError) {
        return err;
    }

    if (err instanceof LogicError) {
        return toHttpError.call(err);
    }

    const msg = err?.message || '<no message>';
    return toHttpError.call(new LogicError(LogicError.Types.Unknown, msg));
}
