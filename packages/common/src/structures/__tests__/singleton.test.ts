import { describe, test, vi } from 'vitest';
import { createSingleton } from '../singleton.js';
import type { DisposeFunction, IDisposable } from '../../functions/disposer.js';
import * as Math from '../../math/calc.js';
import type { IValueModel } from '../../models/types.js';

describe('createSingleton', () => {
    test('creates', () => {
        class Test implements IDisposable {

            constructor(public readonly id?: number) {
                this.dispose = vi.fn();
            }

            dispose: DisposeFunction;
        }

        let _id = 0;
        const setId = vi.fn();
        const idModel: IValueModel<number> = {
            set value(value: number) {
                _id = value;
                setId(value);
            },
            get value() {
                return _id;
            },
        };

        const extension = {
            onDestroyed: vi.fn(),
            createId: () => idModel,
        };

        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1234);

        const Singleton = createSingleton(Test, extension);

        expect(Singleton.constructor).toBeFunction();
        expect(Singleton.name).toBe('TestSingleton');
        expect(Singleton.HasInstance).toBeFalse();

        const instance = Singleton.Instance;
        expect(Singleton.HasInstance).toBeTrue();
        expect(instance.constructor.name).toBe('Test');
        expect(instance).toBeInstanceOf(Test);
        expect(instance.id).toBe(1234);
        expect(Singleton.ID).toBe(1234);
        expect(setId).toHaveBeenCalledWith(1234);

        expect(Singleton.Instance).toStrictEqual(instance);
        expect(Singleton.HasInstance).toBeTrue();

        const disposeFn = instance.dispose;

        Singleton.Destroy();
        expect(extension.onDestroyed).toHaveBeenCalledTimes(1);
        expect(disposeFn).toHaveBeenCalledTimes(1);
        expect(Singleton.HasInstance).toBeFalse();

        Singleton.Destroy(); // Should not throw or do anything
        expect(extension.onDestroyed).toHaveBeenCalledTimes(1);
        expect(disposeFn).toHaveBeenCalledTimes(1);
        expect(Singleton.ID).toBe(0);

        const Singleton2 = createSingleton(Test);
        // another singleton should not affect the first one
        expect(Singleton2.Instance).not.toBe(instance);

        randomSpy.mockRestore();
    });
});
