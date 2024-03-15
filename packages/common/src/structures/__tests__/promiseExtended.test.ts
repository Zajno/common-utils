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

    it('static: succeeded', async () => {
        const _onSuccess = vi.fn();
        const _onError = vi.fn();

        const res = PromiseExtended.succeeded('test')
            .onSuccess(_onSuccess)
            .onError(_onError);

        await expect(res).resolves.not.toThrow();

        expect(_onSuccess).toHaveBeenCalledTimes(1);
        expect(_onSuccess).toHaveBeenCalledWith('test');

        expect(_onError).toHaveBeenCalledTimes(0);
    });

    it('static: errored', async () => {

        const testError = async (pr: PromiseExtended<void>, errResult: { error: string, source: Error }) => {
            const _onSuccess = vi.fn();
            const _onError = vi.fn();

            await expect(
                pr
                    .onSuccess(_onSuccess)
                    .onError(_onError)
            ).resolves.not.toThrow();

            expect(_onSuccess).toHaveBeenCalledTimes(0);

            expect(_onError).toHaveBeenCalledTimes(1);
            expect(_onError).toHaveBeenCalledWith(errResult);
        };

        await testError(
            PromiseExtended.errored(new Error('test error')),
            { error: 'test error', source: new Error('test error') }
        );

        await testError(
            PromiseExtended.errored('test error'),
            { error: 'test error', source: new Error('test error') }
        );
    });

    // case: if inner promise is PromiseExtended, ideally would be connect corresponding onSuccess/onError handlers
    // but in case it has been wrapped with a regular promise, we'll receive the resolved underlying data before we can connect handlers
    // so it's not possible to get inner instance in this case

    // the idea is to combine multiple async steps into one PromiseExtended so the final result will be handled by onSuccess/onError
    describe('example for combining', () => {

        const asyncValidator = async (input: number) => {
            await setTimeoutAsync(50);
            if (input < 0.5 || input > 1) {
                throw new Error('not in range');
            }
        };

        const asyncWorker = async (input: number) => {
            await setTimeoutAsync(100);
            return input * 2;
        };

        const worker = (input: number) => PromiseExtended.run(async () => {
            // sync validation step
            if (input < 0.5) {
                // can be done via regular throw as well
                return PromiseExtended.errored('too small')
                    .pop();
            }

            // async validation step, can throw in Promise
            await asyncValidator(input);

            // the worker itself, with `pop` added so `onSuccess`/`onError` will be connected to the parent
            // basically, either `return` or `await` is needed here; but missing both will result to UnhandledRejection due to nature of `pop` mechanism.
            return await PromiseExtended
                .run(() => asyncWorker(input))
                .pop();
        });

        const testWith = async (input: number, expected: number | PromiseExtended.ErrorData) => {
            const _onSuccess = vi.fn(data => {
                console.log('Success:', input, data);
            });
            const _onError = vi.fn(error => {
                console.error('Error Message:', input, error.error);
            });

            // never throws!
            await expect(
                worker(input)
                    .onSuccess(_onSuccess)
                    .onError(_onError)
            ).resolves.not.toThrow();

            if (typeof expected === 'number') {
                expect(_onSuccess).toHaveBeenCalledTimes(1);
                expect(_onSuccess).toHaveBeenCalledWith(expected);

                expect(_onError).toHaveBeenCalledTimes(0);
            } else {
                expect(_onSuccess).toHaveBeenCalledTimes(0);

                expect(_onError).toHaveBeenCalledTimes(1);
                expect(_onError).toHaveBeenCalledWith(expected);
            }
        };

        it('error: sync validation', async () => {
            await testWith(0, { error: 'too small', source: new Error('too small') });
        });

        it('error: async validation', async () => {
            await testWith(2, { error: 'not in range', source: new Error('not in range') });
        });

        it('success', async () => {
            await testWith(0.75, 1.5);
        });
    });
});
