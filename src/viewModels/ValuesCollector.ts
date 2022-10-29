import { IValueModel } from './types';

export interface IValueCollector<TSource, TValue> {
    getValue(source: TSource): TValue;
    setValue(source: TSource, value: TValue): void;
}

type SimpleCollector<T> = {
    get: () => T,
    set: (t: T) => void,
};

type SimpleCollectorsMap<T> = {
    [P in keyof T]?: SimpleCollector<T[P]>;
};

export type ModelCollectorsMap<T> = {
    [P in keyof T]?: IValueModel<T[P]>;
};

export type CollectorsMap<T> = {
    [P in keyof T]?: SimpleCollector<T[P]>;
};

export class ModelCollector<T extends Object> {

    private readonly _collectors: SimpleCollectorsMap<T> = { };

    public addModels(models: ModelCollectorsMap<T>) {
        Object.entries(models).forEach(pair => this.addModel(pair[0] as keyof T, pair[1]));
        return this;
    }

    public addModel<TKey extends keyof T, TSource extends IValueModel<T[TKey]>>(key: TKey, source: TSource) {
        this._collectors[key] = {
            get: () => source.value,
            set: v => { source.value = v; },
        };

        return this;
    }

    public addCollector<TKey extends keyof T, TModel, TCollector extends IValueCollector<TModel, T[TKey]>>(key: TKey, model: TModel, collector: TCollector) {
        this._collectors[key] = {
            get: () => collector.getValue(model),
            set: v => collector.setValue(model, v),
        };

        return this;
    }

    public remove(key: keyof T) {
        delete this._collectors[key];

        return this;
    }

    public collect(): T {
        const res = { } as T;

        Object.entries(this._collectors).forEach(pair => {
            const key = pair[0] as keyof T;
            const collector = pair[1] as SimpleCollector<T[keyof T]>;
            res[key] = collector.get();
        });

        return res;
    }

    public populate(data: T) {
        Object.entries(data).forEach(pair => {
            const key = pair[0] as keyof T;
            const value = pair[1] as T[keyof T];

            const collector = this._collectors[key];
            if (collector) {
                collector.set(value);
            }
        });
    }
}
