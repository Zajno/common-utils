import { build, construct, Empty, IBuilder } from '../builder.js';
import { combineUrls } from '../utils.js';

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

        // @ts-expect-error `asOptional` is not available on static builder
        const e4 = e3.asOptional?.() ?? e3;
        expect(e4.build({})).toBe('path/to');
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

        test('no slashes - default options', () => {

            const example = build`${'version'}-${'id'}`.withDefaults({ separator: '' });

            expect(example.build({ version: 'v1', id: '123' })).toBe('v1-123');
            expect(example.build({ version: 'v1', id: '123' }, { separator: '$' })).toBe('v1$-$123');
            expect(example.template()).toBe('version-id');
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
            expect(example.build({})).toBe('api/user');
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

            { // check `asOptional`
                const id = build`${'id'}`;

                // ok case
                const res0 = id.build({ id: 123 });
                expect(res0).toBe('123');

                // @ts-expect-error `id` is required
                const res1 = id.build({});
                expect(res1).toEqual('');

                const optional = id.asOptional();
                const res2 = optional.build({}); // ok, no error
                expect(res2).toBe('');

                optional.build({ id: undefined }); // ok, no error
                optional.build({ id: null }); // ok, no error
            }

            { // check `asOptional` in pair with combiner/constructor
                const id = construct('user', build`${'id'}`, build`${'type'}`);

                // ok case
                const res0 = id.build({ id: 123, type: 'full' });
                expect(res0).toBe('user/123/full');

                // @ts-expect-error `id` is required
                const res1 = id.build({ type: 'full' });
                expect(res1).toBe('user/full');

                // @ts-expect-error `type` is required
                const res11 = id.build({ id: 123 });
                expect(res11).toBe('user/123');

                const optional = id.asOptional();
                const res2 = optional.build({}); // ok, no error
                expect(res2).toBe('user');
            }

            { // check `asOptional` for combined
                const id = construct(
                    'user',
                    build`${'id'}`,
                    build`${'type'}`
                        .asOptional(),
                );

                // ok: all accepted
                const res0 = id.build({ id: 123, type: 'full' });
                expect(res0).toBe('user/123/full');

                // ok: skipping optional
                const res1 = id.build({ id: 123 });
                expect(res1).toBe('user/123');

                // TODO: error: skipping NOT optional
                let res2 = id.build({ type: '123' });
                expect(res2).toBe('user/123');
                res2 = id.build({ });
                expect(res2).toBe('user');
            }
        });
    });

    describe('construct many', () => {
        test('should build path', () => {
            expect(construct().build()).toBe('');

            expect(construct(
                'foo',
                'bar',
            ).build()).toBe('foo/bar');

            expect(construct(
                'foo',
                build`api/${'version'}`,
                'bar',
            ).build({ version: 'v1' })).toBe('foo/api/v1/bar');

            const complex = construct(
                'prefix',
                build`api/${'version'}`,
                'middle',
                build`user/${'id'}`,
                'suffix',
            );

            expect(complex.build({ version: 'v1', id: '123' })).toBe('prefix/api/v1/middle/user/123/suffix');

            // @ts-expect-error missing args
            expect(complex.build({ id: '123' })).toBe('prefix/api/middle/user/123/suffix');

            // @ts-expect-error extraneous args
            expect(complex.build({ version: 'v1', id: '123', extra: 'extra' })).toBe('prefix/api/v1/middle/user/123/suffix');

            expect(complex.template()).toBe('prefix/api/version/middle/user/id/suffix');
            expect(complex.args).toEqual(['version', 'id']);
            expect(complex.as<IBuilder>()).toBe(complex);
        });
    });

    describe('transform', () => {

        test('should build path with build transforms', () => {
            const example = build`api/${'version'}/user/${'id'}`;

            const transformed = example.withBuildTransform({
                version: v => `v${v}`,
                id: id => `#${id}`,
            });

            expect(transformed.build({ version: '1', id: '123' })).toBe('api/v1/user/#123');
            expect(transformed.build({ version: 2, id: 321 })).toBe('api/v2/user/#321');
            expect(transformed.build({ version: '3', id: '321' }, { addStart: true, addTrail: true })).toBe('/api/v3/user/#321/');

            expect(transformed.template()).toBe('api/version/user/id');
            expect(transformed.template(':')).toBe('api/:version/user/:id');
            expect(transformed.template(s => `\${${s}}`)).toBe('api/${version}/user/${id}');
        });

        test('should build path with template transforms', () => {
            const example = build`api/${'version'}/user/${'id'}`;

            const transformed = example.withTemplateTransform({
                version: v => `_${v}`,
                id: id => `${id}?`,
            });

            expect(transformed.build({ version: '1', id: '123' })).toBe('api/1/user/123');
            expect(transformed.build({ version: 2, id: 321 })).toBe('api/2/user/321');
            expect(transformed.build({ version: '3', id: '321' }, { addStart: true, addTrail: true })).toBe('/api/3/user/321/');

            expect(transformed.template()).toBe('api/_version/user/id?');
            expect(transformed.template(':')).toBe('api/:_version/user/:id?');
            expect(transformed.template(s => `\${${s}}`)).toBe('api/${_version}/user/${id?}');
        });

        test('should not affect on static path', () => {

            const example = construct(build`api/v1`, '');

            const transformed = example
                .withBuildTransform({})
                .withTemplateTransform({})
                .withDefaults({ separator: '$#*@%T&*' })
                ;

            expect(transformed.build()).toBe('api/v1');
            expect(transformed.build({}, { separator: '1231234' })).toBe('api/v1');
            expect(transformed.build({}, { separator: '?', addStart: true, addTrail: true })).toBe('?api/v1?');

            expect(transformed.template()).toBe('api/v1');
            expect(transformed.template(':')).toBe('api/v1');
            expect(transformed.template('?????', { separator: '?', addStart: true, addTrail: true })).toBe('?api/v1?');
        });

    });
});
