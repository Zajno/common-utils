

/** @deprecated */
export function formatDate(date: Date) {
    const pad = (n: number, count = 2) => n.toString().padStart(count, '0');

    const y = pad(date.getUTCFullYear(), 4);
    const m = pad(date.getUTCMonth() + 1);
    const d = pad(date.getUTCDate());

    const hr = pad(date.getUTCHours());
    const min = pad(date.getUTCMinutes());
    const sec = pad(date.getUTCSeconds());

    return `${y}.${m}.${d}_${hr}.${min}.${sec}`;
}
