import { observable } from 'mobx';

export enum ObservableTypes {
    Ref = 'ref',
    Shallow = 'shallow',
    Full = 'full',

    Default = Ref,
}

export namespace ObservableTypes {
    export function toDecorator(typeOrIsRef: ObservableTypes | boolean) {
        if (typeof typeOrIsRef === 'boolean') {
            return typeOrIsRef
                ? observable.ref
                : observable;
        }

        switch (typeOrIsRef) {
            case ObservableTypes.Ref:
                return observable.ref;
            case ObservableTypes.Shallow:
                return observable.shallow;
            default:
                return observable;
        }
    }
}
