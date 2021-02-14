
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
