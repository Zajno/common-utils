import { LogicModel as _LogicModel } from '@zajno/common/models/LogicModel';
import { LoadingModel } from './LoadingModel';

export class LogicModel extends _LogicModel {
    protected pureConstructLoadingModel(useFirstInit: boolean) {
        return new LoadingModel(useFirstInit);
    }
}