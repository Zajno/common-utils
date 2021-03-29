import { observable, makeObservable } from 'mobx';

export type PromptModalAction = {
    title: string;
    message: string;
    confirmText: string;
    rejectText?: string;
    onConfirm: () => Promise<void> | void;
    onReject?: () => Promise<void> | void;
    modalImage?: number;
    confirmColor?: string;
    rejectColor?: string;
    awaitActions?: boolean;
};

export class PromptModalViewModel {
    @observable
    private _isActive: boolean = false;

    @observable
    private _currentAction: PromptModalAction;

    constructor() {
        makeObservable(this);
    }

    get isActive() {
        return this._isActive;
    }

    set isActive(val: boolean) {
        this._isActive = val;
    }

    get currentAction() { return this._currentAction; }

    get confirmColor() { return this._currentAction.confirmColor; }

    get rejectColor() { return this._currentAction.rejectColor; }

    openModal(action: PromptModalAction) {
        this._currentAction = action;
        this._isActive = true;
    }

    public closeModal() {
        this._isActive = false;
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
