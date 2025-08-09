import { action, makeObservable } from 'mobx';
import { NumberModel } from './NumberModel.js';
import type { IResettableModel, IValueModel } from '@zajno/common/models/types';
import { withLoading as _withLoading, LoadingModel as _LoadingModel } from '@zajno/common/models/Loading';

export class LoadingModel extends _LoadingModel {

    constructor(useFirstInit = false) {
        super(useFirstInit);

        makeObservable(this, {
            setValue: action,
        });
    }

    protected pureConstructNumberModel(): IValueModel<number> & IResettableModel {
        return new NumberModel(0);
    }

    protected get numberModel(): NumberModel {
        return this._number as NumberModel;
    }

    protected incrementLoading(): void {
        this.numberModel.increment();
    }

    protected decrementLoading(): void {
        this.numberModel.decrement();
    }
}

export const withLoading = action(_withLoading);
