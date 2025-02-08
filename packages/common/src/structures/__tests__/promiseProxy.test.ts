import { setTimeoutAsync } from '../../async/timeout.js';
import { createPromiseProxy } from '../promiseProxy.js';

// tests for createPromiseProxy
describe('createPromiseProxy', () => {
    it('should return a proxy object', () => {
        const proxy = createPromiseProxy({ loader: () => Promise.resolve({}) });
        expect(proxy).toBeInstanceOf(Object);
    });

    it('should return a proxy object with a promise', async () => {
        const obj = { };
        const proxy = createPromiseProxy({ loader: () => Promise.resolve(obj) });
        expect(proxy.__promise).toBeInstanceOf(Promise);
        await expect(proxy.__promise).resolves.toBe(obj);
    });

    it('should store a field in proxy and then set it in the resolved object', async () => {
        const obj = { foo: null as string | null, bar: vi.fn() };
        const proxy = createPromiseProxy({ loader: () => setTimeoutAsync(10).then(() => obj) });
        proxy.foo = 'bar';

        expect(() => { (proxy as any).bar(); }).toThrow();

        await expect(proxy.__promise).resolves.toBe(obj);
        expect(obj.foo).toBe('bar');
        expect(obj.bar).toHaveBeenCalledTimes(0);
    });

    it('should accept a function call on a proxy object and then call it on the resolved object', async () => {
        const obj = {
            // this key should be forbidden - uncomment to see TS error
            // __promise: null as Promise<any>,
            foo: null as string | null,
            bar(v: string) { this.foo = v; },
            faz: vi.fn() as () => void,
        };
        const proxy = createPromiseProxy({
            loader: () => setTimeoutAsync(10).then(() => obj),
            fnKeys: [ 'bar', 'faz'],
        });
        expect(proxy.foo).toBeUndefined();
        proxy.foo = '123';
        proxy.bar('bar');
        proxy.faz();

        expect(Object.keys(proxy)).toEqual([ 'foo' ]);

        await expect(proxy.__promise).resolves.toBe(obj);

        expect(proxy.__promise).toBeNull();

        // changes are reflected in the resolved object
        expect(obj.foo).toBe('bar');
        expect(obj.faz).toHaveBeenCalledTimes(1);
        // proxy object returns exactly the same fields as the resolved object
        expect(Object.keys(proxy)).toEqual(Object.keys(obj));
        expect(proxy.foo).toBe(obj.foo);

        proxy.faz();
        expect(obj.faz).toHaveBeenCalledTimes(2);

        proxy.foo = '456';
        expect(obj.foo).toBe('456');
    });

    it('should accept a wrapper with additional fields or functions that will NOT be copied to the resolved object but still exist in proxy', async () => {
        const obj = {
            foo: null as string | null,
            bar(v: string) { this.foo = v; },
        };

        const disposeFn = vi.fn();

        const proxy = createPromiseProxy({
            loader: () => setTimeoutAsync(10).then(() => obj),
            fnKeys: [ 'bar' ],
            wrap: { dispose: disposeFn },
        });
        proxy.bar('bar');
        proxy.dispose();

        expect(proxy.dispose).toBe(disposeFn);
        expect(proxy.foo).toBeUndefined();
        expect(disposeFn).toHaveBeenCalledTimes(1);

        expect(obj.foo).toBeNull();
        expect((obj as any).dispose).toBeUndefined();

        await expect(proxy.__promise).resolves.toBe(obj);

        expect(proxy.foo).toBe('bar');

        proxy.dispose();

        expect(disposeFn).toHaveBeenCalledTimes(2);

        expect(obj.foo).toBe('bar');
        expect((obj as any).dispose).toBeUndefined();
    });
});
