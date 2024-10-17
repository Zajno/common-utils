import { ExampleEndpoint } from '../../examples/compositeFunctionExample.js';

describe('functions definitions arg/result processors', () => {
    const d = ExampleEndpoint.v1();

    describe('first level', () => {
        it('just compiles', () => expect(d.specs.example).toBeTruthy());
        const { ArgProcessor, ResultProcessor } = d.specs.example;

        it('processes arg', () => {
            expect(ArgProcessor).not.toBeNull();
            expect(ArgProcessor({ id: 'a' }))
                .toMatchObject({ example: { id: 'a' } });
        });
        it('processes result', () => {
            expect(ResultProcessor).not.toBeNull();
            expect(ResultProcessor({ example: { ok: true } }))
                .toMatchObject({ ok: true });
        });
    });

    describe('second level', () => {
        it('just compiles', () => expect(d.specs.namespace.nested).toBeTruthy());
        const { ArgProcessor, ResultProcessor } = d.specs.namespace.nested;

        it('processes arg', () => {
            expect(ArgProcessor).not.toBeNull();
            expect(ArgProcessor({ lol: 'a' }))
                .toMatchObject({ namespace: { nested: { lol: 'a' } } });
        });
        it('processes result', () => {
            expect(ResultProcessor).not.toBeNull();
            expect(ResultProcessor({ namespace: { nested: { kek: 1 } } }))
                .toMatchObject({ kek: 1 });
        });
    });

    describe('third level', () => {
        it('just compiles', () => expect(d.specs.namespace.inner['double-nested']).toBeTruthy());
        const { ArgProcessor, ResultProcessor } = d.specs.namespace.inner['double-nested'];

        it('processes arg', () => {
            expect(ArgProcessor).not.toBeNull();
            expect(ArgProcessor({ in: 'a' }))
                .toMatchObject({ namespace: { inner: { ['double-nested']: { in: 'a' } } } });
        });
        it('processes result', () => {
            expect(ResultProcessor).not.toBeNull();
            expect(ResultProcessor({ namespace: { inner: { ['double-nested']: { out: 'a' } } } }))
                .toMatchObject({ out: 'a' });
        });
    });
});
