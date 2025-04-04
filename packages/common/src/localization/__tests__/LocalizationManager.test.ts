import { setTimeoutAsync } from '../../async/timeout.js';
import { LocalizationManager } from '../LocalizationManager.js';

describe('LocalizationManager', () => {

    const EnStrings = {
        'hello': 'Hello',
    };

    const UaStrings: typeof EnStrings = {
        'hello': 'Привіт',
    };

    const dataSource = {
        'en': EnStrings,
        'ua': async () => UaStrings,
        'de': null as unknown as typeof EnStrings,
    } as const;

    type Locales = keyof typeof dataSource;

    it('correctly initialized', () => {
        const manager = new LocalizationManager(dataSource, 'en' as Locales, EnStrings);

        expect(manager.Locale).toBe('en');
        expect(manager.Current).toEqual(EnStrings);
    });

    it('async initialization', async () => {
        const manager = new LocalizationManager({
            ...dataSource,
            en: async () => EnStrings,
        }, 'en' as Locales);

        expect(manager.Locale).toBe('en');
        expect(manager.Current).toBe(null);
        expect(manager.firstInitialized).toBeInstanceOf(Promise);

        await expect(manager.firstInitialized).resolves.not.toThrow();
        expect(manager.Locale).toBe('en');
        expect(manager.Current).toEqual(EnStrings);
    });

    it('correctly switches locales', async () => {
        const manager = new LocalizationManager(dataSource, 'en' as Locales, EnStrings);

        const onChanged = vi.fn();
        const off = manager.localeUpdated.on(onChanged);

        await expect(manager.useLocale('ua')).resolves.not.toThrow();
        expect(manager.Locale).toBe('ua');
        expect(manager.Current).toEqual(UaStrings);

        expect(onChanged).toHaveBeenCalledTimes(1);
        expect(onChanged).toHaveBeenCalledWith({ locale: 'ua', strings: UaStrings });

        onChanged.mockClear();

        await expect(manager.useLocale('en')).resolves.not.toThrow();
        expect(manager.Locale).toBe('en');
        expect(manager.Current).toEqual(EnStrings);
        expect(onChanged).toHaveBeenCalledTimes(1);
        expect(onChanged).toHaveBeenCalledWith({ locale: 'en', strings: EnStrings });

        onChanged.mockClear();

        // repeated update to check no event is triggered
        await expect(manager.useLocale('en')).resolves.not.toThrow();
        expect(manager.Locale).toBe('en');
        expect(manager.Current).toEqual(EnStrings);

        expect(onChanged).not.toHaveBeenCalled();

        off();
    });

    it('throws on unknown locale', async () => {
        const manager = new LocalizationManager(dataSource, 'en' as Locales, EnStrings);

        await expect(manager.useLocale('unknown' as Locales)).rejects.toThrowError('LocalizationManager: No localization data for locale "unknown"');
        expect(manager.Locale).toBe('en');

        await expect(manager.useLocale('de')).rejects.toThrowError('LocalizationManager: No localization data for locale "de"');
        expect(manager.Locale).toBe('en');
    });

    it('throws on loader error', async () => {
        const manager = new LocalizationManager(
            {
                ...dataSource,
                'de': async () => {
                    throw new Error('Loader error');
                },
            },
            'en' as Locales,
        );

        await expect(manager.useLocale('de')).rejects.toThrowError('LocalizationManager: Failed to load localization data for locale "de"');
        expect(manager.Locale).toBe('en');
        expect(manager.Current).toEqual(EnStrings);
    });

    it('recovers from loader error w/ race condition', async () => {
        const manager = new LocalizationManager(
            {
                ...dataSource,
                'de': async () => {
                    await setTimeoutAsync(10);
                    throw new Error('Loader error');
                },
            },
            'en' as Locales,
        );

        await expect(manager.firstInitialized).resolves.not.toThrow();
        expect(manager.Locale).toBe('en');
        expect(manager.Current).toEqual(EnStrings);

        // starting loading of de locale which will fail
        const p1 = manager.useLocale('de');
        // immediately starting loading of ua locale which will succeed synchronously
        const p2 = manager.useLocale('ua');

        // check that ua locale is set immediately since it is sync
        expect(manager.Locale).toBe('ua');

        // wait for the de locale to finish loading and throw
        await expect(p1).rejects.toThrow();

        // check that ua locale was set successfully
        await expect(p2).resolves.not.toThrow();

        // check that locale is still ua
        expect(manager.Locale).toBe('ua');
        expect(manager.Current).toEqual(UaStrings);
    });
});
