import { ApiEndpoint, type IEndpointInfo } from '../endpoint.js';
import { Path } from '../../structures/path/index.js';
import { EndpointMethods } from '../methods.js';
import { type Mutable } from '../../types/misc.js';
import { IEndpointInputContentType } from '../extensions/contentType.js';
import { IEndpointInputValidation } from '../extensions/validation.js';
import { buildApiCaller } from '../call.js';

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
            .withHeaders({ 'x-token': '123' })
            .finalize();

        expect(endpoint.displayName).toBe('Get User');
        expect(endpoint.method).toBe('POST');
        expect(endpoint.queryKeys).toEqual(['full']);

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

        expect(ApiEndpoint.create().get().method).toBe('GET');
        expect(ApiEndpoint.create().delete().method).toBe('DELETE');
        expect(ApiEndpoint.create().put().method).toBe('PUT');
        expect(ApiEndpoint.create().method).toBe('GET');
        expect(ApiEndpoint.create().put().post().method).toBe('POST');

        expect(ApiEndpoint.create().withMethod(EndpointMethods.PUT).method).toBe('PUT');

        expect(ApiEndpoint.create().delete().method).toBe('DELETE');
    });

    describe('extends', () => {
        it('basic/contentType', () => {
            const create = ApiEndpoint.create.extend(IEndpointInputContentType.extender);

            const endpointExtended = create('Get User');
            expect(endpointExtended.contentType).toBeUndefined();

            endpointExtended.asUrlEncoded();
            expect(endpointExtended.contentType).toBe('application/x-www-form-urlencoded');
            expect(endpointExtended.withContentType('text/plain').contentType).toBe('text/plain');
            expect(endpointExtended.asMultipartForm().contentType).toBe('multipart/form-data');
            expect(endpointExtended.asJson().contentType).toBe('application/json');
        });

        it('basic/validation', () => {
            const create = ApiEndpoint.create.extend(IEndpointInputValidation.extender);

            const endpointExtended = create('Get User')
                .post<{ id: string }, { name: string }>();

            expect(endpointExtended.validate).toBeUndefined();

            endpointExtended.withValidation(input => {
                type BanAny<T, Y, N> = 0 extends (1 & T) ? Y : N;
                const i: BanAny<typeof input.id, never, typeof input> = input;
                // no-op usage of input.id to check its type is not 'any'
                // eslint-disable-next-line no-console
                console.log(i.id);
            });

             buildApiCaller({
                request: async () => null!,
                hooks: {
                    beforeConfig: async (api, body) => {
                        // just type checking here
                        await IEndpointInputValidation.tryValidate(api, body);
                    },
                },
            });
        });

        it('custom', () => {

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
            expect(endpoint.path.template(':', { addStart: true })).toBe('/user/:id');

            const finalized = endpoint.finalize();
            expect((finalized as unknown as typeof endpoint).withCustomField).toBeUndefined();
            expect(finalized.customField).toBe('123');
            expect(finalized.path.template(':', { addStart: true })).toBe('/user/:id');
        });
    });

});
