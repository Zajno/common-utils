import { Path } from '../../structures/path/index.js';
import { ApiEndpoint } from '../endpoint.js';
import { EndpointsPathsConfig } from '../config.js';

describe('api/helpers', () => {

    const testSettings = {
        templateArgPrefix: '$',
        basePrefix: '/api/',
    };

    const Helper = new EndpointsPathsConfig(testSettings);

    test('settings', () => {
        expect(Helper.expose()).toEqual(testSettings);
        expect(Helper.getPath(ApiEndpoint.create().withPath(), {}, true)).toEqual('/api/');
        expect(Helper.getPath(ApiEndpoint.create(), {}, true)).toEqual('/api/');

        expect(Helper.getTemplate(ApiEndpoint.create())).toEqual('/api/');
        expect(Helper.getTemplate(ApiEndpoint.create().withPath())).toEqual('/api/');
    });

    test('getPath', () => {
        const endpoint = ApiEndpoint.create()
            .get()
            .withPath('user', Path.build`${'id'}`);

        expect(Helper.getTemplate(endpoint)).toEqual('/api/user/$id');
        expect(Helper.getTemplate(endpoint, '/prefix/')).toEqual('/prefix/user/$id');
        expect(Helper.getPath(endpoint, { id: 123 })).toEqual('/api/user/123');

        expect(Helper.getFormattedDisplayName(endpoint)).toEqual('/api/user/$id');
        (endpoint as any).displayName = 'get user';
        expect(Helper.getFormattedDisplayName(endpoint)).toEqual('[get user] /api/user/$id');
    });

});
