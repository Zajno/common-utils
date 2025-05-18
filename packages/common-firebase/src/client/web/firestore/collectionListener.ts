import { action, makeObservable, observable, ObservableMap, runInAction } from 'mobx';
import { type IDisposable, Disposer } from '@zajno/common/functions/disposer';
import { Event } from '@zajno/common/observing/event';
import type { IdentAny } from '@zajno/common/types/ident';
import { Query } from 'firebase/firestore';
import type { QuerySnapshotCallback } from '../../../database/types.js';
import { querySnapshot } from './querySnapshot.js';
import { assert } from '@zajno/common/functions/assert';

type ArgsToQuery<T, TArgs> = (args: TArgs) => { query: Query<T>, debugName?: string };

export class CollectionListener<T extends IdentAny, TArgs = any> implements IDisposable {

    private readonly _disposer = new Disposer();

    private readonly _items: T[] = [];
    private readonly _byKey: ObservableMap<string, T[]>;

    private readonly _onAllUpdated = new Event<T[]>();
    private _queryBuilder: ArgsToQuery<T, TArgs> | null = null;

    constructor() {
        makeObservable<CollectionListener<any>, '_items' | '_reAssemble'>(this, {
            _items: observable.shallow,
            _reAssemble: action,
        });

        this._byKey = observable.map(new Map<string, T[]>(), { deep: false });
    }

    public get onAllUpdated() { return this._onAllUpdated.expose(); }

    public get all(): ReadonlyArray<Readonly<T>> { return this._items; }

    public addQueryBuilder(builder: ArgsToQuery<T, TArgs>) {
        this._queryBuilder = builder;
        return this;
    }

    public getByKey(key: string): ReadonlyArray<Readonly<T>> | undefined { return this._byKey.get(key); }

    public async addCollection(key: string, query: Query<T>, cb?: QuerySnapshotCallback<T>, debugName?: string): Promise<void> {
        this._disposer.execute(key);

        this._disposer.add(
            await querySnapshot(
                query,
                async (items: T[]) => {
                    runInAction(() => {
                        this._byKey.set(key, items);
                        this._reAssemble();
                    });

                    if (cb) {
                        await cb(items);
                    }
                },
                undefined,
                debugName,
            ),
            key,
        );
    }

    public addCollectionByArgs(key: string, args: TArgs, cb?: QuerySnapshotCallback<T>) {
        if (!this._queryBuilder) {
            throw new Error('query builder is not set');
        }
        const query = this._queryBuilder(args);
        assert(query.query && query.query instanceof Query, 'query must be a valid Query object');
        return this.addCollection(key, query.query, cb, query.debugName);
    }

    private _reAssemble() {
        // dedupe
        const all = new Map<string, T>();
        for (const items of this._byKey.values()) {
            items.forEach(i => all.set(i.id, i));
        }

        // re-assemble all items array
        this._items.length = 0;
        this._items.push(...all.values());

        this._onAllUpdated.trigger(this._items);
    }

    public removeCollection(key: string) {
        this._disposer.execute(key);
        this._byKey.delete(key);
        this._reAssemble();
    }

    public dispose() {
        this._disposer.dispose();
    }
}
