import logger from '@zajno/common/logger';
import {
    IDocumentReference,
    IQuery,
    IQuerySnapshot,
} from './types';


let docsCounter = 0;
let LOG_DOCS_COUNT = true;

export function enableQueriesLogging(v: boolean) { LOG_DOCS_COUNT = v; }

export const logDocCount = (doc: IDocumentReference, sub: boolean) => LOG_DOCS_COUNT && logger.log(
    '[Firestore] ===> documentSnapshot',
    sub ? '(SUB)' : '',
    ++docsCounter,
    doc.path,
);

let queryCounter = 0;
export const logQueryCount = (q: IQuery, s: IQuerySnapshot, sub: boolean, name?: string) => LOG_DOCS_COUNT && logger.log(
    '[Firestore] ===> querySnapshot',
    sub ? '(SUB)' : '',
    s.size,
    (queryCounter += s.size),
    getQueryPath(q, name),
);

export function getQueryPath(q: IQuery, debugName?: string) {
    return debugName || q.debugName || q.path || `<${typeof q} ${q.constructor?.name}>`;
}
