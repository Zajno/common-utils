
export function getTime(d: null | undefined): null;
export function getTime(d: Date | number | string): number;

export function getTime(d: Date | number | string | null | undefined) {
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

export function getDate(d: null | undefined): null;
export function getDate(d: Date | number | string): Date;

export function getDate(d: Date | number | string | null | undefined): Date | null {
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
