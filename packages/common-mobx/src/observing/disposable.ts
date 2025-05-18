import type { ISymbolDisposable } from '@zajno/common/functions/disposer';
import { reaction, autorun } from 'mobx';

type FnOverride<T extends (...args: any[]) => any> = (...args: Parameters<T>) => ISymbolDisposable;

export const reactionDisposable: FnOverride<typeof reaction> = (getter, effect, options): ISymbolDisposable => {
    const dispose = reaction(getter, effect, options);
    return {
        dispose,
        [Symbol.dispose]: dispose,
    };
};

export const autorunDisposable: FnOverride<typeof autorun> = (view, options): ISymbolDisposable => {
    const dispose = autorun(view, options);
    return {
        dispose,
        [Symbol.dispose]: dispose,
    };
};
