import { IFocusableModel } from '@zajno/common/models/types';
import { FlagModel } from './FlagModel';

export function extendObjectWithFocusable<T extends object>(obj: T, onSetFocus?: (v: boolean) => void): T & IFocusableModel {
    const _focused = new FlagModel();
    Object.defineProperty(obj, 'focused', {
        get: () => _focused.value,
        set: v => {
            _focused.value = v;
            onSetFocus?.(v);
        },
    });
    return obj as T & IFocusableModel;
}
