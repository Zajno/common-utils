import { Disposer } from '@zajno/common/functions/disposer';
import { PromiseCacheObservable } from '../promiseCache';
import { reaction, runInAction } from 'mobx';
import { setTimeoutAsync } from '@zajno/common/async/timeout';

describe('PromiseCache observable', () => {
    it('reacts on change', async () => {
        const cache = new PromiseCacheObservable(
            async (id: string) => id,
        );

        const handler = vi.fn();
        const checkHandler = (v: string | undefined) => {
            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith(v);

            handler.mockClear();
        };

        const disposer = new Disposer();
        disposer.add(
            reaction(
                () => cache.getCurrent('1', false),
                v => handler(v),
                { fireImmediately: true },
            )
        );

        checkHandler(undefined);

        await expect(cache.getDeferred('1').promise).resolves.toBe('1');

        checkHandler('1');

        cache.clear();

        checkHandler(undefined);

        cache.updateValueDirectly('1', '2');

        checkHandler('2');

        disposer.dispose();
    });

    it('inner observable', async () => {
        const cache = new PromiseCacheObservable(
            async (id: string) => ({ id }),
        ).useObserveItems(true);

        const handler = vi.fn();
        const checkHandler = (res: any) => {
            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith(res);

            handler.mockClear();
        };

        const disposer = new Disposer();
        disposer.add(
            reaction(
                () => cache.getCurrent('1', false)?.id,
                v => handler(v),
                { fireImmediately: true },
            )
        );

        checkHandler(undefined);

        await expect(cache.getDeferred('1').promise).resolves.toStrictEqual({ id: '1' });

        checkHandler('1');

        const item = cache.getCurrent('1', false);
        expect(item).toBeDefined();

        runInAction(() => {
            item!.id = '2';
        });

        checkHandler('2');

        disposer.dispose();
    });

    it('handles invalidation by timeout', async () => {
        const fetcher = vi.fn(async (id: string) => setTimeoutAsync(10).then(() => ({ id })));

        const cache = new PromiseCacheObservable(fetcher)
            .useInvalidationTime(10)
            // .useLogger('test')
            ;

        const handler = vi.fn();
        const checkHandler = (res: any) => {
            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith(res);

            handler.mockClear();
        };

        const disposer = new Disposer();
        disposer.add(
            reaction(
                () => cache.getCurrent('1', false),
                v => handler(v?.id),
                { fireImmediately: true },
            )
        );

        checkHandler(undefined);

        const deferred = cache.getDeferred('1');

        const doPass = async () => {
            // busy should be undefined when item is invalidated
            expect(deferred.busy).toBe(undefined);
            expect(deferred.current).toBeUndefined();
            // here busy should be true since fetch is in progress
            expect(deferred.busy).toBe(true);

            await setTimeoutAsync(10);

            expect(deferred.current).toStrictEqual({ id: '1' });
            expect(deferred.busy).toBe(false);

            expect(fetcher).toHaveBeenCalledTimes(1);
            fetcher.mockClear();

            checkHandler('1');
        };

        // PASS 1 - initial fetch
        await doPass();

        // WAITING FOR INVALIDATION
        await setTimeoutAsync(20);

        // PASS 2 - re-fetch after invalidation

        // here the target item should be invalidated and re-fetched
        // so the handler should be called with an updated value
        await doPass();

        disposer.dispose();
    });

    it('handles invalidation by timeout with keepInstance', async () => {
        const fetcher = vi.fn(async (id: string) => ({ id }));

        const cache = new PromiseCacheObservable(fetcher)
            .useInvalidationTime(10, true)
        ;

        const handler = vi.fn();
        const checkHandler = (res: any) => {
            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith(res);

            handler.mockClear();
        };

        const disposer = new Disposer();
        disposer.add(
            reaction(
                () => cache.getCurrent('1', false),
                v => handler(v?.id),
                { fireImmediately: true },
            )
        );

        checkHandler(undefined);

        const deferred = cache.getDeferred('1');


        // PASS 1 - initial fetch
        // busy should be undefined when item is empty
        expect(deferred.busy).toBe(undefined);
        expect(deferred.current).toBeUndefined();
        // here busy should be true since fetch is in progress
        expect(deferred.busy).toBe(true);

        await setTimeoutAsync(5);

        expect(deferred.current).toStrictEqual({ id: '1' });
        expect(deferred.busy).toBe(false);

        expect(fetcher).toHaveBeenCalledTimes(1);
        fetcher.mockClear();

        checkHandler('1');

        // WAITING FOR INVALIDATION
        await setTimeoutAsync(20);

        // PASS 2 - re-fetch after invalidation

        expect(deferred.busy).toBe(undefined);
        expect(fetcher).toHaveBeenCalledTimes(0);

        expect(deferred.current).toStrictEqual({ id: '1' }); // returning old value

        expect(handler).toHaveBeenCalledTimes(0); // no reaction

        // here busy should be true since fetch is in progress
        expect(deferred.busy).toBe(true);

        await setTimeoutAsync(5);

        expect(deferred.current).toStrictEqual({ id: '1' });
        expect(deferred.busy).toBe(false);

        expect(fetcher).toHaveBeenCalledTimes(1);
        fetcher.mockClear();

        checkHandler('1');

        disposer.dispose();
    });
});
