import { FirestoreLogging } from './logging.js';
import {
    IDocumentReference,
    IQuery,
    IQuerySnapshot,
} from './types.js';

let docsCounter = 0;

export const logDocCount = (doc: IDocumentReference, sub: boolean) => FirestoreLogging.logger?.log(
    '===> documentSnapshot',
    sub ? '(SUB)' : '',
    ++docsCounter,
    doc.path,
);

let queryCounter = 0;
export const logQueryCount = (q: IQuery, s: IQuerySnapshot, sub: boolean, name?: string) => FirestoreLogging.logger?.log(
    '===> querySnapshot',
    sub ? '(SUB)' : '',
    s.size,
    (queryCounter += s.size),
    getQueryPath(q, name),
);

export function getQueryPath(q: IQuery, debugName?: string) {
    return debugName || q.debugName || q.path || `<${typeof q} ${q.constructor?.name}>`;
}
