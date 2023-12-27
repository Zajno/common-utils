import { shiftDate } from './shift';
import { Granularity } from './types';

export type Period = { amount: number, granularity: Granularity };
export namespace Period {
    export function forward(period: Period, base: Date | number = new Date()): Date {
        return shiftDate(base, period.amount, period.granularity);
    }

    export function backward(period: Period, base: Date | number = new Date()): Date {
        return shiftDate(base, -period.amount, period.granularity);
    }

    export function toMs(period: Period, now = new Date()) {
        const prev = backward(period, now);
        return now.getTime() - prev.getTime();
    }

    export function format(p: Period) {
        return `${p.amount} ${p.granularity}${p.amount > 1 ? 's' : ''}`;
    }
}
