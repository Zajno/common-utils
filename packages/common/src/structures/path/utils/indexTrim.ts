
export type TrimChar<T extends string, C extends string> = [T] extends undefined
    ? ''
    : T extends `${C}${infer R}`
        ? TrimChar<R, C>
        : T extends `${infer R}${C}`
            ? TrimChar<R, C>
            : T;

export function indexTrim<T extends string, C extends string>(str: T | null | undefined, ch: C): TrimChar<T, C> {
    if (!str || !ch || str as string === ch as string) {
        return '' as TrimChar<T, C>;
    }

    let start = 0, end = str.length;

    while (start < end && str[start] === ch)
        ++start;

    while (end > start && str[end - 1] === ch)
        --end;

    return ((start > 0 || end < str.length)
        ? str.substring(start, end)
        : str) as TrimChar<T, C>;
}
