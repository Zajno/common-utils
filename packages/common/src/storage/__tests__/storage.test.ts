import { Storages, IStorageSync, IStorage } from '../index';

describe('storage', () => {
    it('should convert storage to async storage', async () => {
        const storage: IStorageSync = {
            getValue: (key: string) => key,
            setValue: (key: string, value: string) => {
                expect(value).toBe('value');
            },
            hasValue: (key: string) => key === 'has',
            removeValue: (key: string) => key === 'remove',
        };

        const asyncStorage = Storages.toAsync(storage);

        await expect(asyncStorage.getValue('key')).resolves.toBe('key');
        await expect(asyncStorage.setValue('key', 'value')).resolves.toBeUndefined();

        await expect(asyncStorage.hasValue('has')).resolves.toBe(true);
        await expect(asyncStorage.hasValue('no')).resolves.toBe(false);

        await expect(asyncStorage.removeValue('remove')).resolves.toBe(true);
        await expect(asyncStorage.removeValue('no')).resolves.toBe(false);
    });

    it('should convert storage to keyed storage', async () => {
        const storage: IStorageSync = {
            getValue: (key: string) => key,
            setValue: (key: string, value: string) => {
                expect(value).toBe('value');
            },
            hasValue: (key: string) => key === 'has',
            removeValue: (key: string) => key === 'has',
        };

        const keyedStorage1 = Storages.toKeyed(storage, 'key');

        expect(keyedStorage1.getValue()).toBe('key');
        expect(keyedStorage1.setValue('value')).toBeUndefined();
        expect(keyedStorage1.hasValue()).toBe(false);
        expect(keyedStorage1.removeValue()).toBe(false);

        const keyedStorage2 = Storages.toKeyed(storage, 'has');

        expect(keyedStorage2.getValue()).toBe('has');
        expect(keyedStorage2.setValue('value')).toBeUndefined();
        expect(keyedStorage2.hasValue()).toBe(true);
        expect(keyedStorage2.removeValue()).toBe(true);
    });

    it('should convert storage to converted storage', async () => {
        const fn = vi.fn();
        const storage: IStorageSync<string> = {
            getValue: (key: string) => key,
            setValue: (key: string, value: string) => {
                fn(key, value);
            },
            hasValue: () => true,
            removeValue: () => true,
        };

        const convertedStorage = Storages.toConverted(storage, v => +(v || 0), v => v.toString());

        expect(convertedStorage.getValue('1')).toBe(1);
        expect(convertedStorage.getValue(null as unknown as string)).toBe(0);
        expect(convertedStorage.setValue('key', 123)).toBeUndefined();

        expect(fn).toHaveBeenCalledWith('key', '123');
        fn.mockClear();

        const jsonConvertedStorage = Storages.toJSONConverted<{ v: number }>(storage);

        expect(jsonConvertedStorage.getValue('{"v":123}')).toStrictEqual({ v: 123 });
        expect(jsonConvertedStorage.getValue(null as unknown as string)).toStrictEqual(null);

        expect(jsonConvertedStorage.setValue('key', { v: 123 })).toBeUndefined();
        expect(fn).toHaveBeenCalledWith('key', '{"v":123}');

    });

    it('should convert async storage to converted async storage', async () => {
        const fn = vi.fn();
        const storage: IStorage<string> = {
            getValue: (key: string) => Promise.resolve(key),
            setValue: (key: string, value: string) => {
                fn(key, value);
                return Promise.resolve();
            },
            hasValue: () => Promise.resolve(true),
            removeValue: () => Promise.resolve(true),
        };

        const convertedStorage = Storages.toConverted(storage, v => +(v || 0), v => v.toString());

        await expect(convertedStorage.getValue('1')).resolves.toBe(1);
        await expect(convertedStorage.getValue(null as unknown as string)).resolves.toBe(0);
        await expect(convertedStorage.setValue('key', 123)).resolves.toBeUndefined();

        expect(fn).toHaveBeenCalledWith('key', '123');
        fn.mockClear();
    });

    it('converters edge cases', async () => {
        // missing fields in storage
        const fakeStorage = {} as IStorageSync;

        const asyncStorage = Storages.toAsync(fakeStorage);

        expect(asyncStorage.getValue).toBeUndefined();
        expect(asyncStorage.setValue).toBeUndefined();
        expect(asyncStorage.hasValue).toBeUndefined();
        expect(asyncStorage.removeValue).toBeUndefined();

        const keyedStorage = Storages.toKeyed(fakeStorage, 'key');

        expect(keyedStorage.getValue).toBeUndefined();
        expect(keyedStorage.setValue).toBeUndefined();
        expect(keyedStorage.hasValue).toBeUndefined();
        expect(keyedStorage.removeValue).toBeUndefined();
    });
});
