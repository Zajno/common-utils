import { ApiEndpoint } from '../endpoint';
import { Path } from '../../structures/path';

describe('api/endpoint', () => {

    it('constructs', () => {

        const endpoint = ApiEndpoint.post<{ id: string }, { name: string }>('Get User')
            .withPath(Path.build`/user/${'id'}`)
            .withQuery<{ full?: boolean }>('full')
            .withErrors<{ message: string }>()
            .withHeaders({ 'x-token': '123' });

        expect(endpoint.pathBuilder.template(':', { addStart: true })).toBe('/user/:id');
        expect(endpoint.pathBuilder.build()).toBe('user');

        // @ts-expect-error extraneous argument
        expect(endpoint.path.build(['123', 123])).toBe('user/123');

        expect(endpoint.method).toBe('POST');
        expect(endpoint.displayName).toBe('Get User');
        expect(endpoint.queryKeys).toEqual(['full']);
        expect(endpoint.isForm).toBeFalsy();

        endpoint.asForm();
        expect(endpoint.isForm).toBe(true);

        expect(ApiEndpoint.get().method).toBe('GET');
        expect(ApiEndpoint.delete().method).toBe('DELETE');
        expect(ApiEndpoint.construct().method).toBe('GET');

        // @ts-expect-error unknown method
        expect(ApiEndpoint.construct('PUT').method).toBe('PUT');

    });

});
