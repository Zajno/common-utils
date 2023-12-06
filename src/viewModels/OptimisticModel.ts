import type { IResetableModel, IValueModel } from '@zajno/common/models/types';
import { Getter } from '@zajno/common/types';
import { ValueModel } from './ValueModel';

/**
 * Optimistic model is a obsevable VM that allows to change its value and then revert it back if the change was not successful.
 *
 * To change value, use `value` property setter or `setValue` method. Setter passed to ctor is async by default and should return whether value was changed successfully.
 *
 * Before calling setter, the model will change its own value to the new one.
 *
 * If the value was not changed successfully, the model will revert the value back to its original value.
 *
 * Otherwise, if the result is truethy, the model will keep the new value, but will not read it from the getter. This is helpful is the getter can return incorrect value right after the change.
 */
export class OptimisticModel<T> implements IValueModel<T>, IResetableModel {

    private readonly _model: ValueModel<T>;

    constructor(private readonly getter: Getter<T>, private readonly setter: (v: T) => Promise<boolean>) {
        this._model = new ValueModel<T>(this.originalValue);
    }

    public get originalValue() { return Getter.getValue(this.getter); }

    public get value(): T { return this._model.value; }
    public set value(v: T) { this.setValue(v); }

    private setValue = async (v: T) => {
        let result = false;
        try {
            this._model.setValue(v);
            result = await this.setter(v);
        } finally {
            if (!result) {
                this.reset();
            }
        }
    };

    public reset = () => {
        this._model.setValue(this.originalValue);
    };
}
