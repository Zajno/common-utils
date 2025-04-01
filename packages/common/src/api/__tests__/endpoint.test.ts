import { ApiEndpoint, IEndpointInfo } from '../endpoint.js';
import { Path } from '../../structures/path/index.js';
import { EndpointMethods } from '../methods.js';
import { Mutable } from '../../types/misc.js';

describe('api/endpoint', () => {

    function testOutput<T extends IEndpointInfo>(_endpoint: T, out: IEndpointInfo.ExtractOut<T>) {
        return out;
    }

    it('constructs', () => {

        const endpoint = ApiEndpoint.create('Get User')
            .post<{ id: string }, { name: string }>()
            .withPath(Path.build`/user/${'id'}`)
            .withQuery<{ full?: boolean }>('full')
            .withErrors<{ message: string }>()
            .withHeaders({ 'x-token': '123' });

        expect(endpoint.displayName).toBe('Get User');
        expect(endpoint.method).toBe('POST');
        expect(endpoint.queryKeys).toEqual(['full']);
        expect(endpoint.isForm).toBeFalsy();

        type TOut = IEndpointInfo.ExtractOut<typeof endpoint>;
        const out: TOut = { name: '123' };
        testOutput(endpoint, out);

        expect(endpoint.path.template(':', { addStart: true })).toBe('/user/:id');
        expect(endpoint.path.build()).toBe('user');

        // @ts-expect-error extraneous argument
        expect(endpoint.path.build(['123', 123])).toBe('user/123');

        expect(endpoint.method).toBe('POST');
        expect(endpoint.displayName).toBe('Get User');
        expect(endpoint.queryKeys).toEqual(['full']);
        expect(endpoint.isForm).toBeFalsy();

        endpoint.asForm();
        expect(endpoint.isForm).toBe(true);

        expect(ApiEndpoint.create().get().method).toBe('GET');
        expect(ApiEndpoint.create().delete().method).toBe('DELETE');
        expect(ApiEndpoint.create().put().method).toBe('PUT');
        expect(ApiEndpoint.create().method).toBe('GET');
        expect(ApiEndpoint.create().put().post().method).toBe('POST');

        expect(ApiEndpoint.create().withMethod(EndpointMethods.PUT).method).toBe('PUT');

        expect(ApiEndpoint.create().delete().method).toBe('DELETE');
    });

    it('extends', () => {

        interface ICustomExtension {
            readonly customField: string | undefined;
            withCustomField(value: string): this;
        }

        const create = ApiEndpoint.create.extend<ICustomExtension>(base => {
            const ext = {
                customField: undefined,
                withCustomField(this: Mutable<ICustomExtension>, value: string) {
                    this.customField = value;
                    return this;
                },
            } as ICustomExtension;
            return Object.assign(base, ext);
        });

        const e1 = create();
        e1.withCustomField('123');

        const endpoint = create().post<{ id: string }, { name: string }>()
            .withCustomField('123')
            .withPath(Path.build`/user/${'id'}`)
        ;

        expect(endpoint.customField).toBe('123');
    });

});
