import { NumberModel } from './NumberModel.js';

export class InitializableModel {
    private readonly _counter = new NumberModel(0);

    public get initializing() { return this._counter.value > 0; }

    protected async runOperation<T>(operation: () => Promise<T> | T): Promise<T> {
        try {
            this._counter.increment();
            const res = await operation();
            return res;
        } finally {
            this._counter.decrement();
        }
    }
}
