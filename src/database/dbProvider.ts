// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type * as FirebaseAdmin from 'firebase-admin';
import type FirebaseClient from 'firebase/app';

/* global FirebaseFirestore */

export type ClientFirestore = FirebaseClient.firestore.Firestore & { isClient: true };
export type ServerFirestore = FirebaseFirestore.Firestore & { isClient: false };

type DBProvider = ClientFirestore | ServerFirestore;

export type DocumentData = FirebaseClient.firestore.DocumentData | FirebaseFirestore.DocumentData;

export type Query<T = DocumentData> = FirebaseClient.firestore.Query<T> | FirebaseFirestore.Query<T>;
export type QuerySnapshot<T = DocumentData> = FirebaseClient.firestore.QuerySnapshot<T> | FirebaseFirestore.QuerySnapshot<T>;
export type DocumentSnapshot<T = DocumentData> = FirebaseClient.firestore.DocumentSnapshot<T> | FirebaseFirestore.DocumentSnapshot<T>;
export type QueryDocumentSnapshot<T = DocumentData> = FirebaseClient.firestore.QueryDocumentSnapshot<T> | FirebaseFirestore.QueryDocumentSnapshot<T>;
export type DocumentReference<T = DocumentData> = FirebaseClient.firestore.DocumentReference<T> | FirebaseFirestore.DocumentReference<T>;

export type CollectionReference<T = DocumentData> = FirebaseClient.firestore.CollectionReference<T> | FirebaseFirestore.CollectionReference<T>;

export type QuerySnapshotCallback<T> = (items: T[]) => void | Promise<void>;
export type QuerySnapshotConverterCallback<T> = (items: DocumentSnapshot<T>[]) => T[];
export type DocumentSnapshotConverterCallback<T> = (item: DocumentSnapshot<T>) => T;
export type DocumentSnapshotCallback<T> = (item: T) => void | Promise<void>;

export type UnsubscribeSnapshot = () => void;

export default DBProvider;
