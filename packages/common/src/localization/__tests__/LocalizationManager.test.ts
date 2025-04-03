import { ILocalizationDependency } from '../abstractions.js';
import { LocalizationManager } from '../LocalizationManager.js';

describe('LocalizationManager', () => {

    const dataSource = {
        'en': {
            'hello': 'Hello',
        },
        'ua': {
            'hello': 'Привіт',
        },
    } as const;

    type Locales = keyof typeof dataSource;

    it('correctly initialized', () => {
        const manager = new LocalizationManager(dataSource, 'en' as Locales, 'en');

        expect(manager.Locale).toBe('en');
        expect(manager.Current).toEqual(dataSource.en);
    });

    it('correctly switches locales', () => {
        const manager = new LocalizationManager(dataSource, 'en' as Locales, 'en');

        const onChanged = vi.fn();
        const off = manager.localeUpdated.on(onChanged);

        manager.useLocale('ua');
        expect(manager.Locale).toBe('ua');
        expect(manager.Current).toEqual(dataSource.ua);

        expect(onChanged).toHaveBeenCalledTimes(1);
        expect(onChanged).toHaveBeenCalledWith('ua');

        off();
    });

    it('updates dependencies', () => {
        const manager = new LocalizationManager(dataSource, 'en' as Locales);

        const cb = vi.fn();
        const dep: ILocalizationDependency<typeof dataSource.en, Locales> = {
            updateLocale: cb,
        };

        manager.useDependency(dep);
        expect(manager.Locale).toBe('en');
        expect(manager.Current).toEqual(dataSource.en);
        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb).toHaveBeenCalledWith(dataSource.en, 'en');
        cb.mockClear();

        // edge case: no locale
        manager.useLocale(null as unknown as Locales);
        expect(manager.Locale).toBe(null);
        expect(manager.Current).toBe(dataSource.en);
        expect(cb).not.toHaveBeenCalled();
        cb.mockClear();

        // switch locale - get update
        manager.useLocale('ua');
        expect(manager.Locale).toBe('ua');
        expect(manager.Current).toEqual(dataSource.ua);
        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb).toHaveBeenCalledWith(dataSource.ua, 'ua');
        cb.mockClear();

        // remove dependency
        manager.useDependency(dep, true);
        manager.useDependency(dep, true); // second time should not do anything
        manager.useLocale('en');
        expect(manager.Locale).toBe('en');

        expect(cb).not.toHaveBeenCalled();

    });
});
