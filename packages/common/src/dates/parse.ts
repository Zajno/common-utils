
export function getTime(d: Date | number | string): number {
    if (d == null) {
        return null;
    }

    if (d instanceof Date) {
        return d.getTime();
    }

    if (typeof d === 'number') {
        return d;
    }

    if (typeof d === 'string') {
        const num = +d;
        if (!isNaN(num)) {
            return num;
        }
    }

    return getDate(d).getTime();
}

export function getDate(d: Date | number | string | undefined): Date {
    if (!d) {
        return null;
    }

    if (typeof d === 'string') {
        const num = +d;
        if (!isNaN(num)) {
            return new Date(num);
        }
    }

    return new Date(d);
}

export namespace Parse {
    /** `YYYY-MM-DD` */
    export function fromDatePicker(str: string, local = false) {
        const result = new Date(str);
        if (local) {
            const offset = result.getTimezoneOffset() * 60000;
            return new Date(result.getTime() + offset);
        }
        return result;
    }
}
