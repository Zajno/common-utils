import { filterFields } from '../filter.js';

describe('fields/filter', () => {
    it('should filter fields', () => {
        const source = {
            a: 1,
            b: null,
            c: 3,
            d: 4,
        };

        const result = filterFields(
            source,
            'a',
            'b',
            { key: 'c', filter: v => (!!v && (v > 2)) },
            { key: 'd', filter: v => (!!v && (v < 4)) },
        );

        expect(result).toEqual({
            a: 1,
            c: 3,
        });
    });

    it('should return empty object if no fields match', () => {
        const source = {
            a: null,
            b: undefined,
            c: false,
            d: 123,
        };

        expect(filterFields(source, 'a', 'b', 'c')).toEqual({});
    });
});
