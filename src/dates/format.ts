import * as MathX from '../math';
import { decompose, decomposeDate, getDate, getDiscreteDiff, getTime } from './convert';
import { YearDate } from './yearDate';

export namespace Format {

    export enum Presets {
        FullDay_ShortDate = 'ddd DD.MM.YYYY',
        ShortDate_FullTime = 'DD.MM.YYYY HH:mm:ss',
    }

    export namespace Presets {
        const defaultFormat = new Intl.DateTimeFormat('default');
        const fullDayShortDate = new Intl.DateTimeFormat('default', {
            weekday: 'long',
        });

        export function use(p: Presets, d: Date, local = true) {
            const dec = decomposeDate(d, local, 'year', 'month', 'day', 'hour', 'minute', 'second');
            switch (p) {
                case Presets.FullDay_ShortDate: {
                    const pts = fullDayShortDate.formatToParts(d);
                    const weekday = pts.find(t => t.type === 'weekday');
                    return `${weekday.value} ${MathX.format(dec.day, 2)}.${MathX.format(dec.month, 2)}.${MathX.format(dec.year)}`;
                }
                case Presets.ShortDate_FullTime: {
                    return `${MathX.format(dec.day, 2)}.${MathX.format(dec.month, 2)}.${dec.year} ${MathX.format(dec.hour, 2)}.${MathX.format(dec.minute, 2)}.${MathX.format(dec.second, 2)}`;
                }
                default: {
                    break;
                }
            }

        }
    }

    export function timespan(ms: Date | number, local = false): string {
        const decs = decompose(getTime(ms), local, 'second', 'minute', 'hour');

        const parts: string[] = [];

        if (decs.hour) {
            parts.push(`${decs.hour}h`);
        }

        if (decs.minute) {
            parts.push(`${decs.minute}m`);
        }

        parts.push(`${decs.second}s`);

        return parts.join(' ');
    }

    /** `YYYY-MM-DD` */
    export function toDatePicker(date: Date | number, local = false): string {
        if (!date) return null;
        const d = getDate(date);
        const dd = decomposeDate(d, local, 'day', 'month', 'year');
        return `${dd.year}-${MathX.format(dd.month, 2)}-${MathX.format(dd.day, 2)}`;
    }

    export function toLocalDate(date: Date | number): string {
        if (!date) return null;
        return getDate(date).toLocaleDateString();
    }

    export function yearDate(yd: YearDate, short = false) {
        const d = new Date(1900, yd?.month || 0, yd?.day || 1);
        return d.toLocaleDateString('default', { month: short ? 'short' : 'long', day: 'numeric' });
    }

    // TODO draft
    export function toDistance(to: Date, from = new Date()) {
        const now = from || new Date();
        const isFuture = now.getTime() < to.getTime();
        const days = getDiscreteDiff(to, now, 'day');
        // console.log('toDistance days =', days);
        if (days < 7) {
            if (days < 1) {
                return 'Today';
            }

            if (days < 2) {
                return isFuture ? 'Tomorrow' : 'Yesterday';
            }

            return isFuture
                ? `In ${Math.floor(days)} days`
                : `${Math.floor(days)} days ago`;
        }

        const weeks = Math.floor(days / 7);
        if (weeks < 2) {
            return isFuture
                ? 'In a week'
                : 'Week ago';
        }

        return isFuture
            ? `In ${weeks} weeks`
            : `${weeks} weeks ago`;
    }
}
