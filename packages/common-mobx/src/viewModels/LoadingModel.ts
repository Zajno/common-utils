import { action } from 'mobx';
import { NumberModel } from './NumberModel.js';
import type { IResetableModel, IValueModel } from '@zajno/common/models/types';
import { withLoading as _withLoading, LoadingModel as _LoadingModel } from '@zajno/common/models/Loading';

export class LoadingModel extends _LoadingModel {

    protected pureConstructNumberModel(): IValueModel<number> & IResetableModel {
        return new NumberModel(0);
    }
}

export const withLoading = action(_withLoading);
