import { getDate } from './parse';


export type Granularity = Granularity.Constant
    | 'month'
    | 'year'
;

export namespace Granularity {

    export type Constant = 'millisecond'
        | 'second'
        | 'minute'
        | 'hour'
        | 'day'
        | 'week' // 1-based
    ;

    export namespace Constant {

        export function toMs(g: Granularity.Constant): number {
            switch (g) {
                case 'millisecond': {
                    return 1;
                }
                case 'second': {
                    return 1000;
                }
                case 'minute': {
                    return 60 * toMs('second');
                }
                case 'hour': {
                    return 60 * toMs('minute');
                }
                case 'day': {
                    return 24 * toMs('hour');
                }
                case 'week': {
                    return 7 * toMs('day');
                }
                default: {
                    throw new Error('Unsupported granularity');
                }
            }
        }

        export function convert(amount: number, g: Granularity.Constant, to: Granularity.Constant) {
            const ms = amount * toMs(g);
            const msTo = toMs(to);
            return ms / msTo;
        }

        export function shift(date: Date | number, amount: number, granularity: Granularity.Constant): Date {
            const res = getDate(date);
            if (amount === 0) {
                return res;
            }

            return new Date(res.getTime() + amount * toMs(granularity));
        }
    }
}
