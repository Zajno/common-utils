import { setTimeoutAsync } from '../../async/timeout.js';
import { LoadingModel } from '../Loading.js';

describe('LoadingModel', () => {
    describe('works', () => {
        const worker = async () => {
            await setTimeoutAsync(100);
            return 100;
        };

        it('basic', async () => {

            const m = new LoadingModel();
            expect(m.value).toBe(false);
            expect(m.isLoading).toBeFalsy();

            const promise1 = m.useLoading(worker);
            expect(m.isLoading).toBeTruthy();

            await setTimeoutAsync(50);

            const promise2 = m.useLoading(worker);

            await promise1;

            await setTimeoutAsync(10);

            expect(m.isLoading).toBeTruthy();

            await promise2;

            expect(m.isLoading).toBeFalsy();
        });

        it('with exclusive', async () => {
            const m = new LoadingModel();

            const first = m.useLoading(worker, true);
            expect(m.isLoading).toBeTruthy();

            const second = m.useLoading(worker, true);
            expect(m.isLoading).toBeTruthy();

            await expect(() => m.useLoading(worker, 'throw')).rejects.toThrow();

            expect(m.isLoading).toBeTruthy();

            await expect(second).resolves.toStrictEqual({ aborted: true });
            await expect(first).resolves.toStrictEqual({ aborted: false, result: 100 });

            expect(m.value).toBe(false);
            expect(m.isLoading).toBeFalsy();
        });

        it('with firstInit', async () => {
            const m = new LoadingModel(true);

            expect(m.isLoading).toBeTruthy();

            const first = m.useLoading(worker, true);
            expect(m.isLoading).toBeTruthy();

            await expect(first).resolves.toStrictEqual({ aborted: false, result: 100 });

            expect(m.isLoading).toBeFalsy();
        });

        it('with firstInit after reset', async () => {
            const m = new LoadingModel(true);

            expect(m.isLoading).toBeTruthy();

            m.reset();

            expect(m.isLoading).toBeFalsy();
        });
    });
});
