import { RemoveFirstParameter, Awaitify } from '../types/functions';

export interface IStorage<T = string> {
    getValue(key: string): Promise<T | null>;
    setValue(key: string, value: T): Promise<void>;

    hasValue(key: string): Promise<boolean>;
    removeValue(key: string): Promise<boolean>;
}

export type IKeyedStorage<T = string> = {
    [P in keyof IStorage<T>]: RemoveFirstParameter<IStorage<T>[P]>;
};

export type IStorageSync<T = string> = Awaitify<IStorage<T>>;
export type IKeyedStorageSync<T = string> = Awaitify<IKeyedStorage<T>>;
