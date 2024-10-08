import { setTimeoutAsync } from '../../async/timeout';
import { LogicModel } from '../logicModel';

describe('LogicModel', () => {

    test('constructs', () => {

        class Controller extends LogicModel { }

        const c1 = new Controller();
        expect(c1.isLoading).toBeTruthy(); // useFirstInit = true by default
        expect((c1 as any).logger._name).toBe('[Controller]');

        const c2 = new Controller('name', false);
        expect(c2.isLoading).toBeFalsy();
        expect((c2 as any).logger._name).toBe('[name]');
    });

    test('runAction', async () => {

        const workerOk = () => setTimeoutAsync(10).then(() => 123);
        const workerFail = () => setTimeoutAsync(10).then(() => { throw new Error('test'); });

        class Controller extends LogicModel {

            testOk = () => this.runAction(workerOk);
            testFail = () => this.runAction(workerFail);

        }

        const c = new Controller();
        {
            const onOk = vi.fn();
            const onFail = vi.fn();
            const p1 = c.testOk()
                .onSuccess(onOk)
                .onError(onFail);

            expect(c.isLoading).toBeTruthy();

            await expect(p1).resolves.toBe(123);

            expect(onOk).toHaveBeenCalledWith(123);
            expect(onFail).not.toHaveBeenCalled();

            expect(c.isLoading).toBeFalsy();
        }

        {
            const onOk = vi.fn();
            const onFail = vi.fn();
            const p1 = c.testFail()
                .onSuccess(onOk)
                .onError(onFail);

            expect(c.isLoading).toBeTruthy();

            await expect(p1).resolves.toBeUndefined();

            expect(onOk).not.toHaveBeenCalled();
            expect(onFail).toHaveBeenCalledWith({ error: 'test', source: new Error('test') });

            expect(c.isLoading).toBeFalsy();
        }

    });

    test('exclusiveness', async () => {
        class Controller extends LogicModel {
            testNonExclusive = () => this.runAction(async () => {
                await setTimeoutAsync(10);
                return 123;
            });

            testExclusive = () => this.runAction(async () => {
                await setTimeoutAsync(10);
                return 123;
            }, { exclusive: true });

            testExclusiveThrow = () => this.runAction(async () => {
                await setTimeoutAsync(10);
                return 123;
            }, { exclusive: 'throw' });

            testExclusiveNoLoading = () => this.runAction(async () => {
                await setTimeoutAsync(10);
                return 123;
            }, { exclusive: true, noLoading: true });
        }

        const c = new Controller();

        const p1 = c.testNonExclusive();
        await setTimeoutAsync(1);
        const p2 = c.testExclusive();
        await setTimeoutAsync(1);
        const p3 = c.testExclusiveThrow();
        await setTimeoutAsync(1);
        const p4 = c.testNonExclusive();
        await setTimeoutAsync(1);
        const p5 = c.testExclusiveNoLoading();

        await expect(p1).resolves.toBe(123);
        await expect(p2).resolves.toBeUndefined();
        await expect(p3.toSuccessPromise()).resolves.toBeFalse();
        await expect(p4).resolves.toBe(123);
        await expect(p5).resolves.toBe(123);
    });

    test('joins', async () => {
        class Controller extends LogicModel {
            testCancel = () => this.runAction(async () => {
                await setTimeoutAsync(10);
                return 123;
            }, { name: 'test1', join: 'cancel' });

            testMerge = () => this.runAction(async () => {
                await setTimeoutAsync(10);
                return 123;
            }, { name: 'test2', join: 'merge' });
        }

        const c = new Controller();

        {
            const p0 = c.testCancel();
            await setTimeoutAsync(1);
            const p1 = c.testCancel();

            await expect(p0).resolves.toBe(123);
            await expect(p1).resolves.toBeUndefined();
        }

        {
            const p0 = c.testMerge();
            await setTimeoutAsync(1);
            const p1 = c.testMerge();

            await expect(p0).resolves.toBe(123);
            await expect(p1).resolves.toBe(123);
        }
    });

});
