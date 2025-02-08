import { reactionDisposable, autorunDisposable } from '../disposable.js';

describe('disposable', () => {

    vi.mock('mobx', async (importOriginal) => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const mod = (await importOriginal()) as typeof import('mobx');

        const reactionMocked: typeof mod.reaction = (...args) => {
            const res = mod.reaction(...args);
            return vi.fn(res) as any;
        };
        const autorunMocked: typeof mod.autorun = (...args) => {
            const res = mod.autorun(...args);
            return vi.fn(res) as any;
        };

        return {
            ...mod,
            reaction: reactionMocked,
            autorun: autorunMocked,
        };
    });

    it('reactionDisposable', () => {
        const effect = vi.fn();
        const result = reactionDisposable(
            () => 123,
            effect,
        );

        const fn = result.dispose;

        {
            using _d = result;
        }

        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('autorunDisposable', () => {
        const result = autorunDisposable(
            () => 123,
        );

        const fn = result.dispose;

        {
            using _d = result;
        }

        expect(fn).toHaveBeenCalledTimes(1);
    });
});
