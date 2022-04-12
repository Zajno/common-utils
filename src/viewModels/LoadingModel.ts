import { NumberModel } from './NumberModel';

export class LoadingModel extends NumberModel {

    public get isLoading() { return this.value > 0; }

    public async useLoading<T>(cb: () => (T | Promise<T>), exclusive: boolean | 'throw' = false): Promise<T | false> {
        if (exclusive && this.isLoading) {
            if (exclusive === 'throw') {
                throw new Error('Operation cannot be started because another one is in progress already.');
            }
            return false;
        }

        this.increment();

        try {
            const res = await cb();
            return res;
        } finally {
            this.decrement();
        }
    }
}
