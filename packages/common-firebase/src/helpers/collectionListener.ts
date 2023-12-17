import { makeObservable, observable, runInAction } from 'mobx';
import { IDisposable, Disposer } from '@zajno/common/functions/disposer';
import { Event } from '@zajno/common/observing/event';
import { IdentAny } from '@zajno/common/types/ident';
import { DBProvider } from '../database';
import { Query, QuerySnapshotCallback } from '../database/dbProvider';
import { querySnapshot } from '../database/helpers';

export type CollectionListenerGeneric<T extends IdentAny> = Omit<CollectionListener<T>, 'addCollection'>;

export class CollectionListener<T extends IdentAny> implements IDisposable {

    private readonly _disposer = new Disposer();

    @observable.shallow
    private readonly _items: T[] = [];

    @observable.shallow
    private readonly _byKey: Partial<Record<string, T[]>> = { };

    private readonly _onAllUpdated = new Event<T[]>();

    constructor(protected readonly db: DBProvider) {
        makeObservable(this);
    }

    get onAllUpdated() { return this._onAllUpdated.expose(); }

    get all(): ReadonlyArray<Readonly<T>> { return this._items; }

    getByKey(key: string): ReadonlyArray<Readonly<T>> | undefined { return this._byKey[key]; }

    async addCollection(key: string, query: Query<T>, cb?: QuerySnapshotCallback<T>): Promise<void> {
        this._disposer.execute(key);

        this._disposer.add(
            await querySnapshot(this.db, query, async (items: T[]) => {
                runInAction(() => {
                    this._byKey[key] = items;

                    // dedupe
                    const all = new Map<string, T>();
                    Object.values(this._byKey).forEach(items => {
                        items?.forEach(i => all.set(i.id, i));
                    });

                    this._items.length = 0;
                    this._items.push(...all.values());

                    this._onAllUpdated.trigger(this._items);
                });

                if (cb) {
                    await cb(items);
                }
            }),
            key,
        );
    }

    removeCollection(key: string) {
        this._disposer.execute(key);
    }

    public dispose() {
        this._disposer.dispose();
    }
}

type ArgsToQuery<T, TArgs> = (args: TArgs) => Query<T>;

type CollectionListenerExtension<T extends IdentAny, TArgs> = CollectionListenerGeneric<T> & {
    addCollection(key: string, args: TArgs, cb?: QuerySnapshotCallback<T>): Promise<void>;
};

export function constructCollectionListener<T extends IdentAny, TArgs>(db: DBProvider, argsConverter: ArgsToQuery<T, TArgs>): CollectionListenerExtension<T, TArgs> {
    const listener = new CollectionListener<T>(db);
    const extension = listener as CollectionListenerGeneric<T> as CollectionListenerExtension<T, TArgs>;

    const originalAddCollection = listener.addCollection.bind(listener);

    extension.addCollection = function(this: CollectionListener<T>, key: string, args: TArgs, cb?: QuerySnapshotCallback<T>) {
        const query = argsConverter(args);
        return originalAddCollection(key, query, cb);
    };

    return extension;
}
