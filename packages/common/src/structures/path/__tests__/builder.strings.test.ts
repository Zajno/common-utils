import { build, construct, IBuilder } from '../builder.js';
import { normalizeInput } from '../builder.helpers.js';

test('helpers', () => {
    expect(normalizeInput([])).toEqual([]);
    expect(normalizeInput(['test'])).toEqual(['test']);

    { // normalize one
        const id = normalizeInput([':id']);
        expect(id).toHaveLength(1);

        const first = id[0] as IBuilder;
        expect(first).toBeTypeOf('object');
        expect(first).toHaveProperty('args');
        expect(first.args).toEqual(['id']);
    }
});

test('strings parsing', () => {
    {
        const id = construct(':id');

        expect(typeof id).toBe('object');
        expect(id.args).toEqual(['id']);

        expect(id.build({ id: 123 })).toBe('123');
        expect(id.build({ id: '321' })).toBe('321');
    }

    {
        const id = construct('user/:id/profile');

        expect(typeof id).toBe('object');
        expect(id.args).toEqual(['id']);

        expect(id.build({ id: 123 })).toBe('user/123/profile');
    }

    { // multiple optional args
        const id = construct('user/:id?/profile/:version?');

        expect(typeof id).toBe('object');
        expect(id.args).toEqual(['id', 'version']);

        // type-checking for array length
        expect(id.args[0]).toBe('id');
        expect(id.args[1]).toBe('version');

        expect(id.build({})).toBe('user/profile');
        expect(id.build({ id: 123 })).toBe('user/123/profile');
        expect(id.build({ id: 123, version: 2 })).toBe('user/123/profile/2');
        expect(id.build({ version: 2 })).toBe('user/profile/2');

        expect(id.build([] as any)).toBe('user/profile');
        expect(id.build([null, null])).toBe('user/profile');
        expect(id.build(['A', null])).toBe('user/A/profile');
        expect(id.build(['A', 'B'])).toBe('user/A/profile/B');
        expect(id.build([null, 'B'])).toBe('user/profile/B');
    }

    { // build with dynamic arg (not intended to work)
        const id = build`:id?`;
        expect(id.args).toEqual([]);
        expect(id.build({ })).toBe(':id?');
    }

    { // args combined
        const id = construct(
            'api',
            ':version?',
            '/:id/profile',
            build`${'action'}`,
            build`mode/${'dry'}`.asOptional(),
        );

        expect(id.args).toEqual(['version', 'id', 'action', 'dry']);

        expect(id.template(':')).toBe('api/:version?/:id/profile/:action/mode/:dry?');
        expect(id.build({ id: 123, action: 'test' })).toBe('api/123/profile/test/mode');
    }
});
