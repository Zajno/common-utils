import * as math from '../index';

describe('math', () => {
    it('getNumberSuffix', () => {
        expect(math.getNumberSuffix(1)).toEqual('st');
        expect(math.getNumberSuffix(11)).toEqual('st');
        expect(math.getNumberSuffix(11111)).toEqual('st');

        expect(math.getNumberSuffix(2)).toEqual('nd');
        expect(math.getNumberSuffix(1232)).toEqual('nd');
        expect(math.getNumberSuffix(32412.99)).toEqual('th');

        expect(math.getNumberSuffix(3)).toEqual('rd');
        expect(math.getNumberSuffix(323)).toEqual('rd');
        expect(math.getNumberSuffix(1233.233)).toEqual('th');

        expect(math.getNumberSuffix(0)).toEqual('th');
        expect(math.getNumberSuffix(145)).toEqual('th');
    });
});
