import { observable, makeObservable } from 'mobx';
import { FlagModel } from './FlagModel';

export type PromptModalAction = {
    title: string;
    message: string;
    confirmText: string;
    rejectText?: string;
    onConfirm: () => Promise<void> | void;
    onReject?: () => Promise<void> | void;
    modalImage?: any;
    confirmColor?: string;
    rejectColor?: string;
    awaitActions?: boolean;
};

export class PromptModalViewModel {
    private readonly _isActive = new FlagModel();

    @observable.ref
    private _currentAction: PromptModalAction = null;

    constructor() {
        makeObservable(this);
    }

    get isActive() {
        return this._isActive.value;
    }

    set isActive(val: boolean) {
        this._isActive.value = val;
    }

    get currentAction() { return this._currentAction; }

    get confirmColor() { return this._currentAction.confirmColor; }

    get rejectColor() { return this._currentAction.rejectColor; }

    openModal(action: PromptModalAction) {
        this._currentAction = action;
        this._isActive.value = true;
    }

    public closeModal() {
        this._isActive.value = false;
    }

    onConfirm = async () => {
        if (this.currentAction.onConfirm) {
            const promise = this.currentAction.onConfirm();
            if (this.currentAction.awaitActions) {
                await promise;
            }
        }

        this.closeModal();
    };

    onReject = async () => {
        if (this.currentAction.onReject) {
            const promise = this.currentAction.onReject();
            if (this.currentAction.awaitActions) {
                await promise;
            }
        }

        this.closeModal();
    };
}
