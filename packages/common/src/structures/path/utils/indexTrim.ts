
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
