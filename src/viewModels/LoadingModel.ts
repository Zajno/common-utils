import { NumberModel } from './NumberModel';

export class LoadingModel extends NumberModel {

    public get isLoading() { return this.value > 0; }

    public async useLoading<T>(cb: () => (T | Promise<T>)): Promise<T> {
        try {
            this.increment();
            const res = await cb();
            return res;
        } finally {
            this.decrement();
        }
    }
}
