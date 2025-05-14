import { Path } from '../../structures/path/index.js';
import { ApiEndpoint } from '../endpoint.js';
import { EndpointsPathsConfig, EndpointsPathsConfigMutable } from '../config.js';
import { LogTypes } from '../logging.js';

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

    test('mutable settings', () => {
        const clone = new EndpointsPathsConfig(Helper.expose());
        expect(clone.expose()).toEqual(testSettings);

        // mutable will follow the original settings
        const mutable = new EndpointsPathsConfigMutable(clone);
        expect(mutable.expose()).toEqual(testSettings);

        mutable.update({ templateArgPrefix: '#' });
        expect(mutable.templateArgPrefix).toEqual('#');
        expect(clone.templateArgPrefix).toEqual('#');

        expect(Helper.templateArgPrefix).toEqual('$');
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

    test('getEndpointsEqual', () => {

        expect(Helper.getEndpointsEqual(null, null)).toBe(true);

        {
            const e1 = ApiEndpoint.create();
            expect(Helper.getEndpointsEqual(e1, e1)).toBe(true);

            expect(Helper.getEndpointsEqual(e1, null)).toBe(false);
            expect(Helper.getEndpointsEqual(null, e1)).toBe(false);

            const e2 = ApiEndpoint.create()
                .get()
                .withPath('user/:id');
            expect(Helper.getEndpointsEqual(e2, e2)).toBe(true);
        }

        const e1 = ApiEndpoint.create()
            .get()
            .withPath('user/:id');

        const e2 = ApiEndpoint.create()
            .get()
            .withPath('user/:id');

        expect(Helper.getEndpointsEqual(e1, e2)).toBe(true);

        const e3 = ApiEndpoint.create()
            .post()
            .withPath('user/:id');

        expect(Helper.getEndpointsEqual(e1, e3)).toBe(false);

        const e4 = ApiEndpoint.create()
            .post()
            .withPath('user/:id/:action');
        expect(Helper.getEndpointsEqual(e1, e4)).toBe(false);
    });

    test('logging/getIsEnabled', () => {
        expect(LogTypes.getIsEnabled(false, 'req')).toEqual({ enabled: false });
        expect(LogTypes.getIsEnabled(false, 'res')).toEqual({ enabled: false });
        expect(LogTypes.getIsEnabled(null, 'req')).toEqual({ enabled: false });
        expect(LogTypes.getIsEnabled(null, 'res')).toEqual({ enabled: false });
        expect(LogTypes.getIsEnabled(undefined, 'req')).toEqual({ enabled: false });
        expect(LogTypes.getIsEnabled(undefined, 'res')).toEqual({ enabled: false });

        expect(LogTypes.getIsEnabled(true, 'req')).toEqual({ enabled: true });
        expect(LogTypes.getIsEnabled(true, 'res')).toEqual({ enabled: true });

        expect(LogTypes.getIsEnabled('full', 'req')).toEqual({ enabled: true });
        expect(LogTypes.getIsEnabled('full', 'res')).toEqual({ enabled: true });

        expect(LogTypes.getIsEnabled('req', 'res')).toEqual({ enabled: false });
        expect(LogTypes.getIsEnabled('req', 'req')).toEqual({ enabled: true });
        expect(LogTypes.getIsEnabled('res', 'req')).toEqual({ enabled: false });
        expect(LogTypes.getIsEnabled('res', 'res')).toEqual({ enabled: true });

        expect(LogTypes.getIsEnabled({ req: true }, 'req')).toEqual({ enabled: true });
        expect(LogTypes.getIsEnabled({ req: true }, 'res')).toEqual({ enabled: false });
        expect(LogTypes.getIsEnabled({ res: true }, 'req')).toEqual({ enabled: false });
        expect(LogTypes.getIsEnabled({ res: true }, 'res')).toEqual({ enabled: true });

        expect(LogTypes.getIsEnabled({ res: true, req: true }, 'req')).toEqual({ enabled: true });
        expect(LogTypes.getIsEnabled({ res: true, req: true }, 'res')).toEqual({ enabled: true });

        const fn = () => 'test';
        expect(LogTypes.getIsEnabled({ req: fn }, 'res')).toEqual({ enabled: false });
        expect(LogTypes.getIsEnabled({ req: fn }, 'req')).toEqual({ enabled: true, formatter: fn });

        const fn2 = () => 'test2';
        expect(LogTypes.getIsEnabled({ req: fn, res: fn2 }, 'res')).toEqual({ enabled: true, formatter: fn2 });
    });

});
