import { observable, reaction, runInAction, toJS } from 'mobx';
import { SubscribersPromiseCache } from '../subscribersPromiseCache';
import { setTimeoutAsync } from '@zajno/common/async/timeout';

type TestItem = {
    hello: string,
};

function createData() {
    const Database: Record<string, TestItem> = observable({
        '123': { hello: 'Hi, 123' },
    });

    const Repository = {
        fetch: (key: string, cb: (value: TestItem) => Promise<void> | void) => {
            return reaction(
                () => Database[key],
                item => {
                    setTimeoutAsync(100).then(() => cb(item));
                },
                { fireImmediately: true, delay: 100 },
            );
        },
    };

    const subscribeFn = jest.fn().mockImplementation();
    const unsubFn = jest.fn().mockImplementation();

    const Cache = new SubscribersPromiseCache((key, cb) => {
        subscribeFn(key);
        const unsub = Repository.fetch(key, cb);
        return () => {
            unsubFn();
            unsub();
        };
    });

    return {
        Database,
        Repository,
        Cache,
        subscribeFn,
        unsubFn,
    };
}


describe('ObservingCache works with', () => {
    it('no observing', async () => {
        const { Database, Cache, subscribeFn, unsubFn } = createData();
        try {
            expect(Cache).not.toBeNull();
            expect(subscribeFn).not.toHaveBeenCalled();
            expect(unsubFn).not.toHaveBeenCalled();

            const KEY = '123';

            const deferred = Cache.get(KEY);

            expect(deferred.busy).toBeUndefined();
            expect(deferred.current).toBeUndefined();
            expect(deferred.busy).toBeTruthy();

            const expectedItem = toJS(Database[KEY]);

            await expect(deferred.promise).resolves.toStrictEqual(expectedItem);

            expect(deferred.current).toStrictEqual(expectedItem);
            expect(deferred.busy).toBeFalsy();

            expect(unsubFn).toHaveBeenCalledTimes(1);

            expect(subscribeFn).toHaveBeenCalledTimes(1);
            expect(subscribeFn).toHaveBeenCalledWith(KEY);

            subscribeFn.mockClear();
            unsubFn.mockClear();

            Database[KEY] = { hello: 'bye' };

            expect(subscribeFn).not.toHaveBeenCalled();
        } finally {
            Cache.dispose();
        }
    });

    it('infinite observing', async () => {
        const { Database, Cache, subscribeFn, unsubFn } = createData();
        try {
            Cache.useObservingStrategy(true);

            const KEY = '123';

            const deferred = Cache.get(KEY);

            expect(deferred.busy).toBeUndefined();
            expect(deferred.current).toBeUndefined();
            expect(deferred.busy).toBeTruthy();

            const expectedItem = toJS(Database[KEY]);

            await expect(deferred.promise).resolves.toStrictEqual(expectedItem);

            expect(deferred.current).toStrictEqual(expectedItem);
            expect(deferred.busy).toBeFalsy();

            expect(unsubFn).not.toHaveBeenCalled();

            expect(subscribeFn).toHaveBeenCalledTimes(1);
            expect(subscribeFn).toHaveBeenCalledWith(KEY);

            subscribeFn.mockClear();
            unsubFn.mockClear();

            const replaceItem: TestItem = { hello: 'bye' };
            runInAction(() => {
                Database[KEY] = replaceItem;
            });

            expect(subscribeFn).not.toHaveBeenCalled();

            await setTimeoutAsync(300);

            expect(deferred.current).toStrictEqual(replaceItem);
        } finally {
            Cache.dispose();
            expect(unsubFn).toHaveBeenCalledTimes(1);
        }
    });
});
