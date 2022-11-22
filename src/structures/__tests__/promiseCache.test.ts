
import { setTimeoutAsync } from '@zajno/common/async/timeout';
import { PromiseCache } from '../promiseCache';

describe('PromiseCache', () => {
    it('hard load', async () => {

        const COUNT = 1000;
        const TEST_ID = '123';
        const TEST_OBJ = { HELLO: 'WORLD' };

        const loaderFn = jest.fn().mockImplementation();

        const cache = new PromiseCache(async _id => {
            loaderFn();
            await setTimeoutAsync(200);
            return TEST_OBJ;
        }, null, null, true);

        expect(cache.busyCount).toBe(0);

        let busyCount = 0;
        for (let i = 0; i < COUNT; ++i) {
            const curr = cache.getDeferred(TEST_ID);
            if (!curr.current && curr.busy) {
                ++busyCount;
            }
        }

        expect(loaderFn).toHaveBeenCalledTimes(1);
        expect(busyCount).toBe(COUNT);

        await expect(cache.getDeferred(TEST_ID).promise).resolves.toBe(TEST_OBJ);
    });
});
