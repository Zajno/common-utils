
/**
 * Checks if a value is a plain object (created by `{}`, `Object.create(null)`, or `new Object()`).
 * Returns `false` for class instances like `FormData`, `Blob`, `Buffer`, etc.
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (value == null || typeof value !== 'object') {
        return false;
    }
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}
