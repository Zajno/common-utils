import { action, makeObservable, observable } from 'mobx';
import { SubscribersMap } from '@zajno/common/structures/subscribersMap';

type Unsub = () => void;

export class SubscribersMapObservable extends SubscribersMap {

    constructor(subscribe: null | ((key: string) => Promise<Unsub[]>), name?: string) {
        super(subscribe, name);

        makeObservable<SubscribersMapObservable, '_count' | 'setCount'>(this, {
            _count: observable,
            setCount: action,
        });
    }
}
