
export type UnsubscribeSnapshot = () => void;

export type UpdateDiff<T> = T extends Object
    ? { [P in keyof T]?: UpdateDiff<T[P]> | Object; }
    : T;

export type QuerySnapshotCallback<T> = (items: T[]) => void | Promise<void>;
export type DocumentSnapshotCallback<T> = (item: T) => void | Promise<void>;
