import { observable, runInAction } from 'mobx';
import { TransitionObserver } from '../transition';

function createStore<T>(value: T) {
    const s = observable.object({
        value: value,

        setValue(v: T) {
            runInAction(() => s.value = v);
        },
    });
    return s;
}

describe('TransitionObserver', () => {

    it('constructs', () => {
        const store = createStore(true);

        let err = null;
        try {
            const to1 = new TransitionObserver();
            to1.observe(() => store.value);
            to1.from('asd');
            to1.to({});
            to1.cb(() => { /* no-op */ });
            to1.fireOnce();
        } catch (_err) {
            err = _err;
        }

        expect(err).toBeNull();
    });

    it('tracks only correct transition – 2 way', () => {
        const store = createStore<boolean | null>(true);

        const cb = jest.fn();

        new TransitionObserver(() => store.value)
            .from(true)
            .to(false)
            .cb(cb)
            .fireOnce();

        store.setValue(null);

        expect(cb).not.toHaveBeenCalled();

        store.setValue(false);

        expect(cb).not.toHaveBeenCalled();

        store.setValue(true);

        expect(cb).not.toHaveBeenCalled();

        store.setValue(false);

        expect(cb).toHaveBeenCalledWith(false);
    });

    it('tracks only correct transition – from', () => {
        const store = createStore<boolean | null>(true);

        const cb = jest.fn();

        const to = new TransitionObserver(() => store.value)
            .from(true)
            .cb(cb);

        store.setValue(null);

        expect(cb).toHaveBeenCalledWith(null);
        cb.mockReset();

        store.setValue(false);

        expect(cb).not.toHaveBeenCalled();
        cb.mockReset();

        store.setValue(true);

        expect(cb).not.toHaveBeenCalled();
        cb.mockReset();

        store.setValue(false);

        expect(cb).toHaveBeenCalledWith(false);
        cb.mockReset();

        to.dispose();
    });

    it('tracks only correct transition – to', () => {
        const store = createStore<boolean | null>(true);

        const cb = jest.fn();

        const to = new TransitionObserver(() => store.value)
            .to(false)
            .cb(cb);

        store.setValue(null);

        expect(to.currentValue).toBeNull();
        expect(cb).not.toHaveBeenCalled();
        cb.mockReset();

        store.setValue(false);

        expect(to.currentValue).toBeFalsy();
        expect(cb).toHaveBeenCalledWith(false);
        cb.mockReset();

        store.setValue(true);

        expect(to.currentValue).toBeTruthy();
        expect(cb).not.toHaveBeenCalled();
        cb.mockReset();

        store.setValue(false);

        expect(cb).toHaveBeenCalledWith(false);
        cb.mockReset();

        to.dispose();
    });

    it('tracks only correct transition – <any>', () => {
        const store = createStore<boolean | null>(true);

        const cb = jest.fn();
        const cbE = jest.fn();

        const to = new TransitionObserver(() => store.value)
            .cb(cb);

        to.event.on(cbE);

        store.setValue(null);

        expect(cbE).toHaveBeenCalledWith(null);
        expect(cb).toHaveBeenCalledWith(null);
        cbE.mockReset();
        cb.mockReset();

        to.forceCheck();

        expect(cbE).toHaveBeenCalledWith(null);
        expect(cb).toHaveBeenCalledWith(null);
        cbE.mockReset();
        cb.mockReset();

        to.forceCall();

        expect(cb).toHaveBeenCalledWith(null);
        cb.mockReset();

        store.setValue(false);

        expect(cbE).toHaveBeenCalledWith(false);
        expect(cb).toHaveBeenCalledWith(false);
        cbE.mockReset();
        cb.mockReset();

        store.setValue(true);

        expect(cbE).toHaveBeenCalledWith(true);
        expect(cb).toHaveBeenCalledWith(true);
        cbE.mockReset();
        cb.mockReset();

        to.dispose();
        store.setValue(false);

        expect(cbE).not.toHaveBeenCalled();
        expect(cb).not.toHaveBeenCalled();
    });

    it('promises 2 times', async () => {

        const store = createStore<boolean>(true);
        const cb = jest.fn();

        const to = new TransitionObserver(() => store.value)
            .to(false)
            .cb(cb);

        for (let i = 1; i <= 2; ++i) {
            store.setValue(true);

            const p = to.getPromise();

            store.setValue(false);

            await expect(p).resolves.toBe(false);
            expect(cb).not.toHaveBeenCalled();
            cb.mockReset();
        }
    });

    it('promising – aborting', async () => {

        const store = createStore<boolean>(true);
        const cb = jest.fn();

        const to = new TransitionObserver(() => store.value)
            .to(false)
            .cb(cb);

        const p = to.getPromise();

        expect(() => to.cb(() => { /* no-op */ })).toThrow();

        to.dispose();

        await expect(p).rejects.toThrow(/Aborted/);
        expect(cb).not.toHaveBeenCalled();
    });

    it('filtering', () => {
        const store = createStore<number>(0);
        const cb = jest.fn();

        const to = new TransitionObserver(() => store.value)
            .cb(cb);

        store.setValue(1);

        expect(cb).toHaveBeenCalledWith(1);
        cb.mockReset();

        to.filter((v) => v > 10);

        store.setValue(2);

        expect(cb).not.toHaveBeenCalled();
        cb.mockReset();

        store.setValue(20);

        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb).toHaveBeenCalledWith(20);
        cb.mockReset();

        to.filter(() => true);

        store.setValue(2);

        expect(cb).toHaveBeenCalledWith(2);
        expect(cb).toHaveBeenCalledTimes(1);
        cb.mockReset();

        to.dispose();
    });
});
