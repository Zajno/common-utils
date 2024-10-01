
export type { UnsubscribeSnapshot, QuerySnapshotCallback, DocumentSnapshotCallback } from '../types';

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
