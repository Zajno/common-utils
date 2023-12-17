
export function calcRem(width: number, height: number, breakpoint: { width?: number, height?: number }) {
    if (!breakpoint.width && !breakpoint.height) {
        return 1;
    }

    if (!breakpoint.height) {
        return width / breakpoint.width!;
    }

    if (!breakpoint.width) {
        return height / breakpoint.height;
    }

    const ab = breakpoint.width / breakpoint.height;
    const avp = width / height;

    const rem = ab < avp
        ? (height / breakpoint.height)
        : (width / breakpoint.width);

    return rem;
}
