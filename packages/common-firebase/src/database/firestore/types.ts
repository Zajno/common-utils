
export type { UnsubscribeSnapshot, QuerySnapshotCallback, DocumentSnapshotCallback } from '../types.js';

/** Duck typed from client Firestore types */

export interface IQuery {
    readonly debugName?: string;

    readonly path?: string;
}

export interface IDocumentReference {
    readonly path: string;
}

export interface IQuerySnapshot {
    readonly size: number;
}
