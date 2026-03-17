import { isPlainObject } from '../isPlainObject.js';

describe('isPlainObject', () => {
    test('returns true for plain objects', () => {
        expect(isPlainObject({})).toBe(true);
        expect(isPlainObject({ a: 1, b: 'hello' })).toBe(true);
        expect(isPlainObject(Object.create(null))).toBe(true);
        expect(isPlainObject(new Object())).toBe(true);
    });

    test('returns false for null and undefined', () => {
        expect(isPlainObject(null)).toBe(false);
        expect(isPlainObject(undefined)).toBe(false);
    });

    test('returns false for primitives', () => {
        expect(isPlainObject(42)).toBe(false);
        expect(isPlainObject('string')).toBe(false);
        expect(isPlainObject(true)).toBe(false);
        expect(isPlainObject(Symbol())).toBe(false);
    });

    test('returns false for arrays', () => {
        expect(isPlainObject([])).toBe(false);
        expect(isPlainObject([1, 2, 3])).toBe(false);
    });

    test('returns false for class instances', () => {
        class MyClass { value = 1; }
        expect(isPlainObject(new MyClass())).toBe(false);
        expect(isPlainObject(new Date())).toBe(false);
        expect(isPlainObject(new Map())).toBe(false);
        expect(isPlainObject(new Set())).toBe(false);
        expect(isPlainObject(/regex/)).toBe(false);
    });

    test('returns false for functions', () => {
        expect(isPlainObject(() => { /* noop */ })).toBe(false);
        expect(isPlainObject(function () { /* noop */ })).toBe(false);
    });
});
