import { Getter } from '../types/getter';
import { ILogger } from './abstractions';
import { CONSOLE } from './console';
import { ProxyLogger } from './proxy';

// TBD Introduce more logger types ?
export type LoggerTypes = 'console';

export type LoggerModes = LoggerTypes // default JS logger types
    | false // disabled
    | Getter<ILogger>; // custom instance or factory

export class LoggersManager {
    private readonly _managed = new Set<ProxyLogger>();
    private readonly _all = new Set<ProxyLogger>();

    private _mode: LoggerModes = false;

    public get mode() { return this._mode; }

    /** Creates and attaches an logger instance created from the current mode  */
    public create(name: string | undefined, mode: undefined | LoggerModes = undefined): ILogger {
        const result = this._createImplementation(mode);
        const proxy = new ProxyLogger(result, name);
        this._managed.add(proxy);
        this._all.add(proxy);
        return proxy;
    }

    /** Attaches existing instance, optionally adds name prefix to it */
    public attach(instance: ILogger, name?: string): boolean {
        const proxy = new ProxyLogger(instance, name);
        this._all.add(proxy);
        return true;
    }

    /** Sets the current mode if changed. All internally created loggers implementation will be overridden with a new implementation according to the new mode.  */
    public setMode(mode: LoggerModes | null | undefined) {
        if (this._mode === mode) {
            return;
        }

        this._mode = mode || false;

        if (!this._mode) {
            for (const l of this._all) {
                l.disable();
            }
        } else {
            for (const l of this._all) {
                if (this._managed.has(l)) {
                    l.setLogger(this._createImplementation());
                } else {
                    l.enable();
                }
            }
        }
    }

    public recognize(instance: ILogger) {
        const result = this._findInstance(instance);
        return result ? instance : null;
    }

    /** Detaches instance so it won't be affected by setting mode later on, optionally disables it */
    public detach(instance: ILogger, terminate = false) {
        const recognized = this.recognize(instance);
        if (!recognized) {
            return false;
        }

        this._all.delete(recognized);
        this._managed.delete(recognized);

        if (terminate) {
            recognized.disable();
        }

        return true;
    }

    private _findInstance(instance: ILogger): instance is ProxyLogger {
        if (!(instance instanceof ProxyLogger)) {
            return false;
        }

        return this._all.has(instance);
    }

    private _createImplementation(overrideMode: LoggerModes | undefined = undefined): ILogger | null {
        const mode = overrideMode !== undefined
            ? overrideMode
            : this._mode;

        switch (mode) {
            case 'console': {
                return CONSOLE;
            }

            case false: {
                return null;
            }

            default: {
                return Getter.getValue(mode);
            }
        }
    }
}
