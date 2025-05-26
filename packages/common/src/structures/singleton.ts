import type { IDisposable } from '../functions/disposer.js';
import { random } from '../math/calc.js';
import { Model } from '../models/Model.js';
import type { IValueModel } from '../models/types.js';

interface ICtor<T extends IDisposable = IDisposable> {
    new(id?: number): T;
}

interface StaticSingleton<TClass extends IDisposable> extends ICtor<TClass> {
    readonly ID: number;
    readonly HasInstance: boolean;
    Destroy(): void;

    readonly BaseClass: ICtor<TClass>;
    readonly Instance: InstanceType<ICtor<TClass>>;

    Extend<TExtended extends TClass>(Child: ICtor<TExtended>): StaticSingleton<TExtended>;
}

type Extensions = {
    onDestroyed?: () => void;
    createId?: () => IValueModel<number>;
};

const defaultCreateId = () => new Model<number>(0);

export function createSingleton<T extends IDisposable>(
    Ctor: ICtor<T>,
    extensions?: Extensions,
): StaticSingleton<T> {

    let _instance: T | null = null;
    type Factory = (id: number) => InstanceType<typeof Ctor>;
    let _factory: Factory = (id: number) => new Ctor(id);

    const _id = (extensions?.createId ?? defaultCreateId)();

    const name = Ctor.name + 'Singleton';

    return ({
        [name]: class extends Ctor {
            static get BaseClass() { return Ctor; }

            static get Instance() {
                if (!_instance) {
                    _id.value = random(1000, 9999);
                    _instance = _factory(_id.value);
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

            /**
             * _Liskov Substitution Principle comes into the room..._
             *
             * This method allows to replace the internal factory function, and while using the same ID and underlying instance storage, the new instances will be of the new type.
             */
            static Extend<TExtended extends T>(Child: ICtor<TExtended>) {
                _factory = id => new Child(id) as InstanceType<typeof Ctor>;
                return this as unknown as StaticSingleton<TExtended>;
            }
        },
    })[name];
}
