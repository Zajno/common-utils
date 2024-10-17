import logger from '../logger/index.js';

export type ProcessingFn<T = unknown> = (input: T) => T;

export class ProcessorsRegistry<K> {
    private readonly _map = new Map<K, ProcessingFn[]>();

    public cleanup() {
        this._map.clear();
    }

    public register<P>(key: K, processor: ProcessingFn<P>, name?: string) {
        const _name = name || processor.name;
        const wrapper = (input: P) => {
            try {
                return processor(input);
            } catch (err) {
                logger.error(`Processor error: ${_name}`, err);
                return input;
            }
        };

        const arr = getArr(this._map, key);
        arr.push(wrapper as ProcessingFn<unknown>);
        return () => removeFromArr(arr, wrapper as ProcessingFn<unknown>);
    }

    public process<T>(key: K, input: T): T {
        const arr = this._map.get(key) as ProcessingFn<T>[];
        return chainProcessors(arr, input);
    }
}


function getArr<K, T extends Array<unknown>>(map: Map<K, T>, key: K) {
    let arr = map.get(key);
    if (!arr) {
        arr = [] as Array<unknown> as T;
        map.set(key, arr);
    }
    return arr;
}


function removeFromArr<T>(arr: T[], item: T) {
    const index = arr.indexOf(item);
    if (index >= 0) {
        arr.splice(index, 1);
    }
}

function chainProcessors<T>(chain: ProcessingFn<T>[], input: T): T {
    return chain?.length
        ? chain.reduce((res, fn) => fn(res), input)
        : input;
}
