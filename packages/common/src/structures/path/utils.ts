import { Nullable } from '../../types/misc';

export function indexTrim(str: string | null | undefined, ch: string) {
    if (!str || str === ch || !ch) {
        return '';
    }

    let start = 0, end = str.length;

    while (start < end && str[start] === ch)
        ++start;

    while (end > start && str[end - 1] === ch)
        --end;

    return (start > 0 || end < str.length)
        ? str.substring(start, end)
        : str;
}

export type CombineOptions = {
    noTrim?: boolean;
    addTrail?: boolean | string;
    addStart?: boolean | string;

    separator?: string;
    trimSymbol?: string;
};

export namespace CombineOptions {
    export function merge(...options: Nullable<CombineOptions>[]): CombineOptions {
        return Object.assign({}, ...options);
    }
}

export function combineUrls(options: Nullable<CombineOptions>, ...parts: Nullable<string>[]): string;
export function combineUrls(...parts: Nullable<string>[]): string;

export function combineUrls(...parts: Nullable<string | CombineOptions>[]) {
    const options = typeof parts[0] === 'string'
        ? null
        : parts[0] as Nullable<CombineOptions>;

    const separator = options?.separator ?? '/';
    const trimSymbol = options?.trimSymbol ?? '/';

    const noTrim = options?.noTrim || false;
    const _parts: string[] = [];

    for (const p of parts) {
        if (typeof p !== 'string') {
            continue;
        }

        let part = p;
        if (!noTrim) {
            part = indexTrim(p, trimSymbol);
        }

        if (part) {
            _parts.push(part);
        }
    }

    let result = _parts.join(separator);

    if (options?.addTrail) {
        const char = typeof options.addTrail === 'string'
            ? options.addTrail
            : separator;
        result += char;
    }

    if (options?.addStart) {
        const char = typeof options.addStart === 'string'
            ? options.addStart
            : separator;
        result = char + result;
    }

    return result;
}
