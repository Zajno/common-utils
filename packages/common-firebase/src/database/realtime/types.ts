
import type { UnsubscribeSnapshot } from '../types.js';

// Super simple duck types for RTDB helpers

export interface ISnapshot<T = any> {
    val(): T;
}

export interface IReference {
    get<T>(): Promise<ISnapshot<T>>;
    onValue<T>(cb: (snapshot: ISnapshot<T>) => any, onError: (err: any) => any): UnsubscribeSnapshot;
}
