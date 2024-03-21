import { Path } from '../../structures/path';
import { ApiEndpoint } from '../endpoint';
import { DefaultSettings, getFormattedDisplayName, getPath, getTemplate, setDefaults } from '../helpers';

describe('api/helpers', () => {

    const testSettings = {
        templateArgPrefix: '$',
        basePrefix: '/api/',
    };

    test('settings', () => {
        setDefaults(testSettings);
        expect(DefaultSettings).toEqual(testSettings);
    });

    test('getPath', () => {
        const endpoint = ApiEndpoint.get()
            .withPath('user', Path.build`${'id'}`);

        expect(getTemplate(endpoint)).toEqual('/api/user/$id');
        expect(getTemplate(endpoint, '/prefix/')).toEqual('/prefix/user/$id');
        expect(getPath(endpoint, { id: 123 })).toEqual('/api/user/123');

        expect(getFormattedDisplayName(endpoint)).toEqual('/api/user/$id');
        endpoint.displayName = 'get user';
        expect(getFormattedDisplayName(endpoint)).toEqual('[get user] /api/user/$id');
    });

});
