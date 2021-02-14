import { IPluggableController } from '../abstractions/controllers/IPluggableController';

export { IPluggableController };

export abstract class PluggableController<T = any> implements IPluggableController {
    private _enabled: boolean;
    private _config: T;

    get enabled() { return this._enabled; }
    get config() { return this._config; }

    async setEnabledAsync(enabled: boolean, config: T = undefined) {
        if (config !== undefined) {
            this.setConfig(config);
        }

        if (this._enabled === enabled) {
            return;
        }

        this._enabled = enabled;
        if (this._enabled) {
            await this.initialize();
        } else {
            await this.dispose();
        }
    }

    setConfig(config: T) {
        this._config = config;
    }

    protected abstract initialize(): Promise<void>;
    protected abstract dispose(): Promise<void>;
}
