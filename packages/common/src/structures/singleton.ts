import type { IDisposable } from '../functions/disposer.js';
import { random } from '../math/calc.js';
import { Model } from '../models/Model.js';
import type { IValueModel } from '../models/types.js';

type StaticSingletonInterface = ReturnType<typeof createSingleton>;
export type StaticSingleton<TClass extends StaticSingletonInterface & { new(...args: unknown[]): TClass }> = InstanceType<TClass>;

type Extensions = {
    onDestroyed?: () => void;
    createId?: () => IValueModel<number>;
};

const defaultCreateId = () => new Model<number>(0);

export function createSingleton<T extends IDisposable>(
    Ctor: new (id?: number) => T,
    extensions?: Extensions,
) {
    let _instance: T | null = null;
    const _id = (extensions?.createId ?? defaultCreateId)();

    const name = Ctor.name + 'Singleton';

    return ({
        [name]: class extends Ctor {
            static get Instance() {
                if (!_instance) {
                    _id.value = random(1000, 9999);
                    _instance = new Ctor(_id.value);
                }

                return _instance;
            }

            static get ID() { return _id.value; }
            static get HasInstance() { return _instance !== null; }

            static Destroy() {
                if (_instance) {
                    _instance.dispose();
                    _instance = null;
                    _id.value = 0;

                    extensions?.onDestroyed?.();
                }
            }
        },
    })[name];
}
