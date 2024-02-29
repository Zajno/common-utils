import { build, construct, Empty, IBuilder } from '../builder';
import { combineUrls } from '../utils';

describe('PathBuilder', () => {

    test('utils', () => {
        expect(combineUrls('api', 'v1')).toBe('api/v1');
        expect(combineUrls({}, 'api', 'v1')).toBe('api/v1');
        expect(combineUrls(null, 'api', 'v1')).toBe('api/v1');
        expect(combineUrls(undefined, 'api', 'v1')).toBe('api/v1');
        expect(combineUrls({ noTrim: true }, 'api', 'v1')).toBe('api/v1');
        expect(combineUrls({ noTrim: true }, 'api/', 'v1')).toBe('api//v1');
        expect(combineUrls({ noTrim: true }, 'api/', '/v1')).toBe('api///v1');
        expect(combineUrls({ addStart: true }, 'api', 'v1')).toBe('/api/v1');
        expect(combineUrls({ addTrail: true }, 'api', 'v1')).toBe('api/v1/');
        expect(combineUrls({ addStart: true, addTrail: true }, 'api', 'v1')).toBe('/api/v1/');
    });

    test('empty', () => {
        const empty = build``;

        expect(empty.build([])).toBe('');
        expect(empty.build()).toBe('');
        expect(empty.build({})).toBe('');
        expect(empty.template()).toBe('');
        expect(empty.args).toEqual([]);

        // @ts-expect-error extraneous args
        expect(Empty.build(['asd'])).toBe('');
        // @ts-expect-error extraneous args
        expect(Empty.build(['api', 'v1'])).toBe('');

        expect(Empty.template()).toBe('');
        expect(Empty.template(null, { addStart: true })).toBe('/');
        expect(Empty.template(null, { addStart: '?' })).toBe('?');

        // extraneous args - will be ignored
        expect(Empty.template('?')).toBe('');
        expect(Empty.args).toEqual([]);

        const empty2 = build`/`;
        expect(empty2.build(undefined, { separator: '', noTrim: true })).toBe('/');
    });

    test('empty construct', () => {
        const e1 = construct(build`api`);
        expect(e1.build()).toBe('api');

        // @ts-expect-error extraneous args
        expect(e1.build({ asd: 123 })).toBe('api');

        const e3 = construct(build`path/to`);
        // @ts-expect-error extraneous args
        expect(e3.build({ asd: 123 })).toBe('path/to');
    });

    test('should build path', () => {

        const example = build`api/${'version'}/user/${'id'}`;

        expect(example.build({ version: 'v1', id: '123' })).toBe('api/v1/user/123');
        expect(example.build({ version: 'v2', id: 321 })).toBe('api/v2/user/321');
        expect(example.build({ version: 'v3', id: '321' }, { addStart: true, addTrail: true })).toBe('/api/v3/user/321/');

        expect(example.args).toEqual(['version', 'id']);

        expect(example.template()).toBe('api/version/user/id');
        expect(example.template(':')).toBe('api/:version/user/:id');
        expect(example.template(s => `\${${s}}`)).toBe('api/${version}/user/${id}');

        // @ts-expect-error extraneous args
        expect(build`api/${'version'}/user`.build({ version: 'v1', id: '123' })).toBe('api/v1/user');

        // ends/starts with slash
        expect(build`/api/${'version'}/user/${'id'}/`.build({ version: 'v1', id: '123' })).toBe('api/v1/user/123');

        // @ts-expect-error missing params
        expect(build`api/${'version'}/user/${'id'}`.build({ version: 'v1' })).toBe('api/v1/user');
        // @ts-expect-error missing params
        expect(build`api/${'version'}/user/${'id'}`.build({ id: 333 })).toBe('api/user/333');
    });

    test('should construct path', () => {

        const example1 = construct('api');

        expect(example1.build([])).toBe('api');
        expect(example1.build({})).toBe('api');
        expect(example1.template()).toBe('api');
        expect(example1.args).toEqual([]);

        const example2 = construct(['api', 'v1', 'user', '123']);

        expect(example2.build([])).toBe('api/v1/user/123');
        expect(example2.build({})).toBe('api/v1/user/123');
        expect(example2.template()).toBe('api/v1/user/123');

        const example3 = construct(build`api/${'version'}/user/${'id'}`);

        expect(example3.build({ version: 'v1', id: '123' })).toBe('api/v1/user/123');
        expect(example3.build({ version: 'v2', id: 321 })).toBe('api/v2/user/321');
        expect(example3.build({ version: 'v3', id: '321' }, { addStart: true, addTrail: true })).toBe('/api/v3/user/321/');
        expect(example3.template()).toBe('api/version/user/id');
        expect(example3.template(':')).toBe('api/:version/user/:id');
        expect(example3.template(s => `\${${s}}`)).toBe('api/${version}/user/${id}');
        expect(example3.args).toEqual(['version', 'id']);
    });

    describe('extra cases', () => {
        test('no slashes', () => {

            const example = build`${'version'}-${'id'}`;

            expect(example.build({ version: 'v1', id: '123' })).toBe('v1/-/123');
            expect(example.build({ version: 'v1', id: '123' }, { separator: '' })).toBe('v1-123');
            expect(example.template(null, { separator: '' })).toBe('version-id');
        });

        test('consequent args', () => {
            const example = build`${'version'}${'id'}`;

            expect(example.build({ version: 'v1', id: 123 })).toBe('v1/123');
            expect(example.build({ version: 'v1', id: 123 }, { addTrail: '#' })).toBe('v1/123#');
        });

        test('no args', () => {
            const example = build`api/${'version'}/user/${'id'}`;

            expect(example.build()).toBe('api/user');

            // @ts-expect-error missing args
            expect(example.build({ })).toBe('api/user');
        });

        test('more types', () => {
            // here mostly just showing how different builders are assignable to generic IBuilder

            const empty = Empty.as<IBuilder>();
            expect(empty.args).toEqual([]);

            const s1 = construct(build`api`).as<IBuilder>();
            expect(s1.args).toEqual([]);

            const d1 = build`api/${'version'}`.as<IBuilder>();
            expect(d1.args).toEqual(['version']);

            const d2 = build`${'version'}`.as<IBuilder>();
            expect(d2.args).toEqual(['version']);
        });
    });
});
