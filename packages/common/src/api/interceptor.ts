import { type IEvent, Event } from '../observing/event.js';
import type { CallerHooks } from './hooks.js';

export type Interceptors<TExtra extends object = object> = {
    [K in keyof CallerHooks<TExtra> as `intercept${Capitalize<K>}`]-?: IEvent<Parameters<NonNullable<CallerHooks<TExtra>[K]>>>;
};
const hookKeys = ['beforeRequest', 'beforeConfig', 'afterResponse'] as const satisfies (keyof CallerHooks)[];
const eventKeys = hookKeys.map(k => `intercept${k.charAt(0).toUpperCase() + k.slice(1)}`) as ReadonlyArray<keyof Interceptors>;

/**
 * Experimental. Creates linked caller hooks and interception events.
 *
 * Use hooks to inject into caller and events to subscribe to them externally.
 */
export function createInterceptor<TExtra extends object = object>() {

    const events = eventKeys.reduce((acc, key) => {
        acc[key] = new Event();
        return acc;
    }, {} as Interceptors<TExtra>);

    const hooks = hookKeys.reduce((acc, key, index) => {
        acc[key] = async (...args: unknown[]) => {
            const event = events[eventKeys[index]] as Event;
            await event.triggerAsync(args);
        };
        return acc;
    }, {} as CallerHooks<TExtra>);

    return {
        hooks,
        events,
    };
}
