import { observable } from 'mobx';

export default class RadioButtonViewModel {
    constructor(label: string) {
        this._label = label;
    }
    @observable
    private _checked: boolean = false;

    @observable
    private _label: string;

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

