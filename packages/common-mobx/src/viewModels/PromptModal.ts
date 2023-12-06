import { observable, makeObservable, action } from 'mobx';
import { FlagModel } from './FlagModel';

export type BaseModalAction = {
    title?: string;
    message?: string;
};

export class ModalActionModel<T extends BaseModalAction = BaseModalAction> {
    public readonly isActive = new FlagModel();

    private _currentAction: T = null;

    constructor() {
        makeObservable<ModalActionModel, '_currentAction'>(this, {
            _currentAction: observable.ref,
            openModal: action,
            closeModal: action,
        });
    }

    get currentAction() { return this._currentAction; }

    public openModal = (action: T) => {
        this._currentAction = action;
        this.isActive.value = true;
    };

    public closeModal = () => {
        this.isActive.value = false;
        this._currentAction = null;
    };

    protected runAction = async (cb: () => Promise<void> | void, close = true, awaitAction = false) => {
        if (cb) {
            const promise = cb();
            if (awaitAction) {
                await promise;
            }
        }

        if (close) {
            this.closeModal();
        }
    };
}

export type PromptModalAction = BaseModalAction & {
    confirmText?: string;
    rejectText?: string;
    onConfirm?: () => Promise<void> | void;
    onReject?: () => Promise<void> | void;
    awaitActions?: boolean;
    modalImage?: any;
    confirmColor?: string;
    rejectColor?: string;
};

export class PromptModalViewModel extends ModalActionModel<PromptModalAction> {
    get confirmColor() { return this.currentAction.confirmColor; }

    get rejectColor() { return this.currentAction.rejectColor; }

    onConfirm = () => this.runAction(this.currentAction.onConfirm, true, this.currentAction.awaitActions);
    onReject = () => this.runAction(this.currentAction.onReject, true, this.currentAction.awaitActions);
}
