import { Path } from '../../structures/path/index.js';
import { ApiEndpoint } from '../endpoint.js';
import { DefaultSettings, getFormattedDisplayName, getPath, getTemplate, setDefaults } from '../helpers.js';

describe('api/helpers', () => {

    const testSettings = {
        templateArgPrefix: '$',
        basePrefix: '/api/',
    };

    test('settings', () => {
        setDefaults(testSettings);
        expect(DefaultSettings).toEqual(testSettings);
        expect(getPath(ApiEndpoint.create().withPath(), {}, true)).toEqual('/api/');
        expect(getPath(ApiEndpoint.create(), {}, true)).toEqual('/api/');

        expect(getTemplate(ApiEndpoint.create())).toEqual('/api/');
        expect(getTemplate(ApiEndpoint.create().withPath())).toEqual('/api/');
    });

    test('getPath', () => {
        const endpoint = ApiEndpoint.create()
            .get()
            .withPath('user', Path.build`${'id'}`);

        expect(getTemplate(endpoint)).toEqual('/api/user/$id');
        expect(getTemplate(endpoint, '/prefix/')).toEqual('/prefix/user/$id');
        expect(getPath(endpoint, { id: 123 })).toEqual('/api/user/123');

        expect(getFormattedDisplayName(endpoint)).toEqual('/api/user/$id');
        (endpoint as any).displayName = 'get user';
        expect(getFormattedDisplayName(endpoint)).toEqual('[get user] /api/user/$id');
    });

});
