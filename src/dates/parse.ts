
export function getTime(d: Date | number): number {
    return d instanceof Date ? d.getTime() : d;
}

export function getDate(d: Date | number | string): Date {
    if (!d) {
        return null;
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
