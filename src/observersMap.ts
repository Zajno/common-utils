import { createLogger, ILogger } from './logger';
import { combineDisposers, IDisposable } from './disposer';
import { NumberModel } from './viewModels/NumberModel';

type Unsub = () => void;

export class ObserversMap implements IDisposable {
    /** Unsusbcrobers map: key => unsub fn */
    private readonly _map = new Map<string, () => void>();
    /** Timeouts map: key => timeout handle */
    private readonly _timeouts = new Map<string, any>();

    private readonly _logger: ILogger = null;
    private readonly _count = new NumberModel();

    constructor(readonly subscribe: null | ((key: string) => Promise<Unsub[]>), readonly name?: string) {
        this._logger = createLogger(`[Observers:${this.name || '?'}]`);
    }

    public get count() { return this._count.value; }

    public getIsObserving(key: string) {
        return this._map.has(key);
    }

    public getHasObserveTimeout(key: string) {
        return this.getIsObserving(key) && this._timeouts.has(key);
    }

    public async enable(key: string, enable: boolean, clearAfter: number = null, existingUnsubs: Unsub[] = null) {
        if (enable === this.getIsObserving(key)) {
            this.refreshTimeout(key, enable, clearAfter, true);
            return;
        }

        if (enable) {
            this._logger.log('Adding observer for key =', key, clearAfter ? `, clearAfter = ${clearAfter}` : '');

            // this marker will help to determine whether unsubscribe was requested while we were in process of subscribing
            let disabed = false;
            const marker = () => { disabed = true; };

            this._map.set(key, marker);

            if (!this.subscribe && !existingUnsubs) {
                throw new Error('Neither subscribe function nor existingUnsubs has been configured');
            }

            const unsubs = existingUnsubs || await this.subscribe(key);
            const result = combineDisposers(...unsubs);

            if (disabed) { // unsubscribe was requested
                result();
            } else {
                this._map.set(key, result);
                this._count.increment();
                this.refreshTimeout(key, true, clearAfter);
            }
        } else {
            this._logger.log('Removing observer for key =', key);
            this.refreshTimeout(key, false);
            const unsub = this._map.get(key);
            this._map.delete(key);
            unsub();
            this._count.decrement();
        }
    }

    private refreshTimeout(key: string, enable: boolean, timeout?: number, refresh = false) {
        const current = this._timeouts.get(key);
        if (current) {
            clearTimeout(current);
            this._timeouts.delete(key);
        }

        if (enable && refresh && current == null) {
            // DO NOT setup new timeout because it's not intended to clear subscribtion if it was previously enabled for long term
            return;
        }

        if (enable && timeout) {
            const t = setTimeout(() => this.enable(key, false), timeout);
            this._timeouts.set(key, t);
        }
    }

    public clear() {
        // Clear timeouts
        for (const t of this._timeouts.values()) {
            clearTimeout(t);
        }
        this._timeouts.clear();

        // Invoke unsubscribers
        for (const u of this._map.values()) {
            u();
        }
        this._map.clear();
        this._count.setValue(0);
    }

    public dispose() {
        this.clear();
    }
}
