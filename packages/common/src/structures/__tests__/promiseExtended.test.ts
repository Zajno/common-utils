import { setTimeoutAsync } from '../../async/timeout';
import { PromiseExtended } from '../promiseExtended';

describe('PromiseExtended', () => {
    it('success', async () => {

        const workerOk = async () => {
            await setTimeoutAsync(100);
            return 'test';
        };

        const _then = vi.fn();
        const _catch = vi.fn();
        const _onSuccess = vi.fn();
        const _onError = vi.fn();
        const _onFinally = vi.fn();

        const res = PromiseExtended
            .run(workerOk)
            .onSuccess(_onSuccess)
            .then(_then)
            .catch(_catch)
            .onError(_onError)
            .finally(_onFinally);

        await expect(res).resolves.not.toThrow();

        expect(_then).toHaveBeenCalledTimes(1);
        expect(_then).toHaveBeenCalledWith('test');

        expect(_catch).toHaveBeenCalledTimes(0);

        expect(_onSuccess).toHaveBeenCalledTimes(1);
        expect(_onSuccess).toHaveBeenCalledWith('test');

        expect(_onError).toHaveBeenCalledTimes(0);

        expect(_onFinally).toHaveBeenCalledTimes(1);
    });

    it('fail', async () => {

        const workerFail = async () => {
            await setTimeoutAsync(100);
            throw new Error('Some error');
        };

        const _then = vi.fn();
        const _catch = vi.fn();
        const _onSuccess = vi.fn();
        const _onError = vi.fn();
        const _onFinally = vi.fn();

        const res = PromiseExtended
            .run(workerFail)
            .then(_then)
            .catch(_catch)
            .onSuccess(_onSuccess)
            .onError(_onError)
            .finally(_onFinally);

        await expect(res).resolves.not.toThrow();

        // then/catch the same as for success
        expect(_then).toHaveBeenCalledTimes(1);
        expect(_catch).toHaveBeenCalledTimes(0);

        expect(_onSuccess).toHaveBeenCalledTimes(0);
        expect(_onError).toHaveBeenCalledTimes(1);

        expect(_onFinally).toHaveBeenCalledTimes(1);
    });

    it('expectError', async () => {
        class CustomError extends Error { }

        const workerFailCustom = async () => {
            await setTimeoutAsync(100);
            throw new CustomError('Some custom error');
        };

        const _onError = vi.fn();

        const res = PromiseExtended
            .run(workerFailCustom)
            .expectError('custom', CustomError)
            .onError(_onError);

        await expect(res).resolves.not.toThrow();

        expect(_onError).toHaveBeenCalledTimes(1);
        expect(_onError).toHaveBeenCalledWith({
            error: 'Some custom error',
            source: new CustomError('Some custom error'),
            custom: new CustomError('Some custom error'),
        });
    });

    it('wrap: returns inner instance', async () => {

        const workerInner = async () => {
            await setTimeoutAsync(100);
            throw new Error('test inner');
        };

        const res0 = PromiseExtended.run(workerInner);
        const res1 = PromiseExtended.run(res0);

        expect(res1).toBeInstanceOf(PromiseExtended);
        expect(res1).toStrictEqual(res0);

        await expect(res1).resolves.not.toThrow();
        await expect(res0).resolves.not.toThrow();
    });

    /* it('wrap: correctly passes onSuccess/onError', async () => {
        const workerInner = async () => {
            await setTimeoutAsync(100);
            throw new Error('test inner');
        };

        const workerWrapper = async () => {
            await setTimeoutAsync(50);
            return PromiseExtended.run(workerInner);
        };

        const _onSuccess = vi.fn();
        const _onError = vi.fn();

        const res2 = PromiseExtended.run(workerWrapper)
            .onSuccess(_onSuccess)
            .onError(_onError);

        await expect(res2).resolves.not.toThrow();

        expect(_onSuccess).toHaveBeenCalledTimes(0);

        expect(_onError).toHaveBeenCalledTimes(1);
        expect(_onError).toHaveBeenCalledWith(new Error('test inner'));
    }); */
});
