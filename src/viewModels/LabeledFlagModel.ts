import { Getter } from '../types';
import { FlagModel, IFlagModel, IFlagModelReadonly } from './FlagModel';

interface ILabel<T> {
    readonly label: T;
}

export type ILabeledFlagModel<T = string> = ILabel<T> & IFlagModel;
export type ILabeledFlagModelReadonly<T = string> = ILabel<T> & IFlagModelReadonly;

export class LabeledFlagModel<T = string> extends FlagModel implements ILabeledFlagModelReadonly<T>, ILabeledFlagModel<T> {
    private readonly _label: Getter<T>;

    constructor(label: Getter<T> = null, initial = false) {
        super(initial);
        this._label = label;
    }

    get label() {
        return Getter.getValue(this._label);
    }
}
