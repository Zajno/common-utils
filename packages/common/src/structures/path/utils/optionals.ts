const OptionalPartsRegex = /\/([\w\-:]+)\?/g;

/** Reformats path from format `'/foo/bar?'` to `'/foo{/bar}'`, according to the latest `path-to-regex` lib rules */
export function replaceOptionalParts(pathname: string) {
    return pathname.replace(OptionalPartsRegex, (_, optionalPart) => {
        return `/{${optionalPart}}`;
    });
}
