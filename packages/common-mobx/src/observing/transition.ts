import { reaction, type IReactionOptions } from 'mobx';
import {
    TransitionObserver as _TransitionObserver,
    waitFor as _waitFor,
    type TransitionReaction,
} from '@zajno/common/observing/transition';
import { Getter } from '@zajno/common/types/getter';

export const createReactionFactory = <T>(options?: IReactionOptions<T, false>): TransitionReaction<T> => {
    return (getter, handler) => reaction(
        Getter.toFn(getter),
        next => handler(next),
        options,
    );
};

export class TransitionObserver<T> extends _TransitionObserver<T> {
    constructor(getter?: () => T) {
        super(createReactionFactory(), getter);
    }
}

export function waitFor<T>(current: () => T, toBe: T) {
    return new TransitionObserver(current)
        .to(toBe)
        .fireOnce()
        .getPromise();
}
