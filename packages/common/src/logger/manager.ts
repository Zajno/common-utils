import { Getter } from '../types/getter.js';
import type { ILogger, LoggerModes } from './types.js';
import { CONSOLE } from './console.js';
import { ProxyLogger } from './proxy.js';
import { batchLoggers } from './batch.js';

export class LoggersManager {
    /** Storage for instances created by this manager */
    private readonly _managed = new Set<ProxyLogger>();

    /** Storage for all attached instances. */
    private readonly _all = new Set<ProxyLogger>();

    /** Current main mode. */
    private _mode: LoggerModes = false;

    /** Additionally attached logger destinations (e.g. for analytics) */
    private readonly _destinations: ProxyLogger[] = [];

    public get mode() { return this._mode; }

    /** Creates and attaches an logger instance created from the current mode  */
    public create(name: string | undefined, mode: undefined | LoggerModes = undefined): ILogger {
        const impl = this._createImplementation(mode);
        const result = batchLoggers(impl, ...this._destinations);

        const proxy = new ProxyLogger(result, name);
        this._managed.add(proxy);
        this._all.add(proxy);
        return proxy;
    }

    /** Attaches existing instance, optionally adds name prefix to it.
     *
     * Useful when it's needed to enable/disable independent logger when this manager's mode changes.
     *
     * @returns - The attached logger instance wrapped in a ProxyLogger.
    */
    public attach(instance: ILogger, name?: string): ProxyLogger {
        const proxy = new ProxyLogger(instance, name);
        this._all.add(proxy);
        this._updateAll(this._mode);
        return proxy;
    }

    /**
     * Adds a destination to the logger manager.
     *
     * This is useful for analytics or other purposes where you want to log to multiple destinations.
     *
     * @param target - Target logger instance that will recieve all logs disregarding current active mode.
     * @param name - An optional name for the destination (prepended to every log message).
     * @returns - A function to remove the destination.
     */
    public addDestination(target: ILogger, name?: string): () => void {
        const proxy = new ProxyLogger(target, name);
        this._destinations.push(proxy);
        this._updateAll(this._mode);

        return () => {
            const index = this._destinations.findIndex((d) => d === proxy);
            if (index !== -1) {
                this._destinations.splice(index, 1);
                this._updateAll(this._mode);
            }
        };
    }

    /**
     * Sets the current mode if changed, for all attached instances.
     *
     * All internally created loggers implementation will be overridden with a new implementation according to the new mode.
     *
     * The rest just attached loggers will be just enabled/disabled based on input mode.
     * */
    public setMode(mode: LoggerModes | null | undefined) {
        if (this._mode === mode) {
            return;
        }

        this._mode = mode || false;
        this._updateAll(this._mode);
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

    private _updateAll(mode: LoggerModes) {
        if (!mode) {
            for (const l of this._all) {
                l.disable();
            }
            return;
        }

        // implementation is shared for all attached loggers
        const impl = this._createImplementation();
        if (!impl && this._destinations.length === 0) {
            // ending up with missing implementation
            this._updateAll(false);
            return;
        }

        const result = batchLoggers(impl, ...this._destinations);

        for (const l of this._all) {
            if (this._managed.has(l)) {
                l.setLogger(result);
            } else {
                l.enable();
            }
        }

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
                return Getter.toValue(mode);
            }
        }
    }

    public expose() {
        const createLogger = this.create.bind(this);
        const detachLogger = this.detach.bind(this);
        const setMode = this.setMode.bind(this);
        const getMode = () => this.mode;

        const logger: ILogger = createLogger(undefined, false);

        return {
            createLogger,
            detachLogger,
            setMode,
            getMode,
            logger,
        };
    }
}
