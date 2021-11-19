import { FlagModel, IFlagModel, IFlagModelReadonly } from './FlagModel';

export interface ILabeledFlagModelReadonly<T = string> extends IFlagModelReadonly {
    readonly label: T;
}

export interface ILabeledFlagModel<T = string> extends IFlagModel {
    readonly label: T;
}

export class LabeledFlagModel<T = string> extends FlagModel implements ILabeledFlagModelReadonly<T>, ILabeledFlagModel<T> {
    private _label: T;

    constructor(label: T) {
        super();
        this._label = label;
    }

    get label() {
        return this._label;
    }
}
