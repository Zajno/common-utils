
export type UnsubscribeSnapshot = () => void;

export type UpdateDiff<T> = T extends object
    ? { [P in keyof T]?: UpdateDiff<T[P]> | object; }
    : T;

export type QuerySnapshotCallback<T> = (items: T[]) => void | Promise<void>;
export type DocumentSnapshotCallback<T> = (item: T) => void | Promise<void>;
