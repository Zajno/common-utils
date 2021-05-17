import { observable, makeObservable } from 'mobx';

export class RadioButtonViewModel {
    constructor(label: string) {
        makeObservable(this);
        this._label = label;
    }
    @observable
    private _checked: boolean = false;

    @observable
    private _label: string = null;

    get checked(){
        return this._checked;
    }

    get label(){
        return this._label;
    }

    set checked(checked){
        this._checked = checked;
    }
}

