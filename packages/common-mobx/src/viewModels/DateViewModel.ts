import { Nullable } from '@zajno/common/types';
import { CommonModel } from './CommonModel';

export class DateViewModel extends CommonModel<Date | null> {

    private _min: Nullable<Date> = null;
    private _max: Nullable<Date> = null;

    public withBounds(min?: Nullable<Date>, max?: Nullable<Date>) {
        this._min = min;
        this._max = max;
        return this;
    }

    public get min() { return this._min; }
    public get max() { return this._max; }
}
