
// eslint-disable-next-line no-console
console.warn('"timeHelper" module is deprecated. Please use "dates" one.');

/** @deprecated */
export function formatMS(ms: number): string {
    if (!ms && ms !== 0) {
        return '';
    }

    const sec = Math.floor((ms / 1000) % 60);
    const min = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 60);

    return `${hours ? hours + ':' : ''}${min < 10 ? '0' + min : min}:${sec < 10 ? '0' + sec : sec}`;
}

/** @deprecated */
export function formatTime(n: number): string {
    if (n < 10) {
        return '0' + n;
    }

    return n.toString();
}

/** @deprecated */
export function secToFormattedMin(totalSec: number): string {
    const sec = Math.round(totalSec) % 60;
    const min = Math.floor((totalSec + 1) / 60);
    let res = `${formatTime(min)}`;

    if (sec) {
        res += ':';
        res += formatTime(Math.floor(sec));
    }

    return res;
}
