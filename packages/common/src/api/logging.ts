import { ILogger } from '../logger/abstractions.js';
import type { Nullable } from '../types/index.js';
import type { IRequestConfig } from './call.js';
import { EndpointMethods } from './methods.js';

/** Describes the way a request is logged.
 *
 * Useful for granular control over logging, especially in production.
*/
export type LogTypes<TIn = any, TOut = any> = boolean | 'full' | LogTypes.Dir | {
    req?: boolean | LogTypes.LogFn<TIn>;
    res?: boolean | LogTypes.LogFn<TOut>;
};

export namespace LogTypes {
    export type Dir = 'req' | 'res';
    export type LogFn<T = any> = (data: T) => void | string | any[];

    /**
     * Get the enabled state of a log type.
     * @param type Log type to check.
     * @param dir Direction of log, either request or response.
    */
    export function getIsEnabled<T = unknown>(type: Nullable<LogTypes>, dir: Dir): { enabled: boolean, formatter?: Nullable<(data: T) => unknown> } {
        if (type) {
            if (type === true || type === 'full' || type === dir) {
                return { enabled: true };
            }

            if (typeof type === 'object') {
                const log = type[dir];
                if (log === true) {
                    return { enabled: true };
                }

                if (typeof log === 'function') {
                    return {
                        enabled: true,
                        formatter: log,
                    };
                }
            }
        }

        return { enabled: false };
    }

    /**
     * An example implementation for logging logic (overload for a request with no data).
     *
     * See the other overload for more details.
    */
    export function logCall(logger: ILogger, cfg: IRequestConfig, dir: 'req'): void;

    /**
     * An example implementation for logging logic (overload for a request with data).
     *
     * * Skips logging if the request is a GET and has no data.
     * * Checks if logging is enabled for the given direction.
     * * Formats the data if a custom formatter is provided.
     * * Logs the data via specified logger.
    */
    export function logCall(logger: ILogger, cfg: IRequestConfig, dir: 'res', data: unknown): void;

    export function logCall(logger: ILogger, cfg: IRequestConfig, dir: LogTypes.Dir, data?: unknown) {
        if (!cfg._meta.api || (dir === 'req' && cfg._meta.api.method === EndpointMethods.GET && cfg.data == null)) {
            return;
        }

        const info = LogTypes.getIsEnabled(cfg._meta.log, dir);
        if (!info.enabled) {
            return;
        }

        const dataLogged = info.formatter
            ? info.formatter(data ?? cfg.data)
            : (data ?? cfg.data);

        const prefix = dir === 'req'
            ? 'REQ ====>'
            : 'RES <====';

        logger.log(prefix, cfg._meta.api.method, cfg.url, dataLogged);
    }


}
