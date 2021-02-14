
export type ConstantGranularity = 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week';
export type Granularity = ConstantGranularity | 'month' | 'year';

export namespace ConstantGranularity {
    export function toMs(g: ConstantGranularity): number {
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
}

