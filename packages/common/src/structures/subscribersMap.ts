import { combineDisposers, type IDisposable } from '../functions/disposer.js';
import { catchPromise } from '../functions/safe.js';
import { Loggable } from '../logger/loggable.js';

type Unsub = () => void;

export class SubscribersMap extends Loggable implements IDisposable {
    /** Unsubscribers map: key => unsub fn */
    private readonly _map = new Map<string, () => void>();
    /** Timeouts map: key => timeout handle */
    private readonly _timeouts = new Map<string, any>();

    protected _count = 0;

    constructor(readonly subscribe: null | ((key: string) => Promise<Unsub[]>), readonly name?: string) {
        super();
    }

    public get count() { return this._count; }

    protected getLoggerName(name: string | undefined): string {
        return `[Observers:${name || '?'}]`;
    }

    public getIsObserving(key: string) {
        return this._map.has(key);
    }

    public getHasObserveTimeout(key: string) {
        return this.getIsObserving(key) && this._timeouts.has(key);
    }

    public async enable(key: string, enable: boolean, clearAfter: number | null = null, existingUnsubs: Unsub[] | null= null) {
        if (enable === this.getIsObserving(key)) {
            this.refreshTimeout(key, enable, clearAfter, true);
            return;
        }

        if (enable) {
            this.logger.log('Adding observer for key =', key, clearAfter ? `, clearAfter = ${clearAfter}` : '');

            // this marker will help to determine whether unsubscribe was requested while we were in process of subscribing
            let disabled = false;
            const marker = () => { disabled = true; };

            this._map.set(key, marker);

            if (!this.subscribe && !existingUnsubs) {
                throw new Error('Neither subscribe function nor existingUnsubs has been configured');
            }

            const unsubs = existingUnsubs || await this.subscribe?.(key) || [];
            const result = combineDisposers(...unsubs);

            if (disabled) { // unsubscribe was requested
                result();
            } else {
                this._map.set(key, result);
                this.setCount(this._count + 1);
                this.refreshTimeout(key, true, clearAfter);
            }
        } else {
            this.logger.log('Removing observer for key =', key);
            this.refreshTimeout(key, false);
            const unsub = this._map.get(key);
            this._map.delete(key);
            unsub?.();
            this.setCount(this._count - 1);
        }
    }

    private refreshTimeout(key: string, enable: boolean, timeout?: number | null, refresh = false) {
        const current = this._timeouts.get(key);
        if (current) {
            clearTimeout(current);
            this._timeouts.delete(key);
        }

        if (enable && refresh && current == null) {
            // DO NOT setup new timeout because it's not intended to clear subscription if it was previously enabled for long term
            return;
        }

        if (enable && timeout) {
            const t = setTimeout(
                () => catchPromise(this.enable(key, false), err => this.logger.error('Unexpected error:', err)),
                timeout,
            );
            this._timeouts.set(key, t);
        }
    }

    protected setCount(v: number) {
        this._count = v;
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
        this.setCount(0);
    }

    public dispose() {
        this.clear();
    }
}
