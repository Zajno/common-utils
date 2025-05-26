import { describe, test, vi } from 'vitest';
import { createSingleton } from '../singleton.js';
import { Disposable, type DisposeFunction, type IDisposable } from '../../functions/disposer.js';
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

    test('extension', () => {

        const baseCtorMarker = vi.fn();

        class Base extends Disposable {
            constructor() {
                super();
                baseCtorMarker();
            }
            public get baseField() {
                return 'base_field';
            }
        }
        const BaseSingleton = createSingleton(Base);

        // basically like this one can extend only static fields
        class TestBad extends BaseSingleton { }

        expect(TestBad.Instance).toBeInstanceOf(Base);
        expect(TestBad.Instance.baseField).toBe('base_field');

        expect(baseCtorMarker).toHaveBeenCalledTimes(1);
        baseCtorMarker.mockClear();

        // a way to trully extend the singleton

        class TestGood extends BaseSingleton.BaseClass {
            public readonly newField = 'new_field';
            public get baseField(): string {
                return 'overridden_base_field';
            }
        }

        const Singleton = BaseSingleton.Extend(TestGood);

        Singleton.Destroy(); // cleanup previous instance

        expect(Singleton.HasInstance).toBeFalse();
        expect(BaseSingleton.HasInstance).toBeFalse();

        expect(Singleton.Instance).toBeInstanceOf(Base);
        expect(Singleton.Instance).toBeInstanceOf(TestGood);
        expect(Singleton.Instance.baseField).toBe('overridden_base_field');
        expect(Singleton.Instance.newField).toBe('new_field');

        // should not affect the original singleton, and they are sharing the same instance
        expect(BaseSingleton.Instance).toStrictEqual(Singleton.Instance);

        expect(baseCtorMarker).toHaveBeenCalledTimes(1);
    });
});
