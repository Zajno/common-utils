import { IStorage } from './abstractions';

export class KeyStorage<T = string> {

    private _convertInput: (v: T) => string = v => v as unknown as string;
    private _convertOutput: (s: string | null) => T = s => s as unknown as T;

    constructor(readonly storage: IStorage, readonly key: string) { }

    addConverters<K>(convertInput: (v: K) => string, convertOutput: (s: string | null) => K) {
        const res = this as unknown as KeyStorage<K>;
        res._convertInput = convertInput;
        res._convertOutput = convertOutput;
        return res;
    }

    addJSONConverters<K>() {
        return this.addConverters<K>(
            v => JSON.stringify(v),
            s => JSON.parse(s || 'null') as K,
        );
    }

    async get(): Promise<T | null> {
        const res = await this.storage.getValue(this.key);
        return this._convertOutput(res);
    }

    async set(v: T): Promise<void> {
        const data = this._convertInput(v);
        return this.storage.setValue(this.key, data);
    }

    public async clean(): Promise<void> {
        await this.storage.remove(this.key);
    }

    public getHasValue(): Promise<boolean> {
        return this.storage.hasValue(this.key);
    }
}
