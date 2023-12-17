
export function getCurrentLocation() {
    return window.location.href;
}

export function getCurrentPath() {
    return window.location.pathname;
}

export function reloadPage() {
    window.location.reload();
}

export function getCurrentSearch() {
    if (!window?.location?.search) {
        return null;
    }
    return new URLSearchParams(window.location.search);
}

export function addParamsToUrl(url: string, additionalUrlParams?: Map<string, string>) {
    let urlWithParams = url;
    try {
        const res = new URL(url.toLowerCase().startsWith('http') ? url : ('http://' + url));
        if (additionalUrlParams) {
            additionalUrlParams.forEach((value: string, key: string) => {
                res.searchParams.append(key, value);
            });
        }
        urlWithParams = res.toString();
    } catch (error) {
        // use original target if url parse error
    }

    return urlWithParams;
}

type QueryObj = Record<string, string | true>;

export function parseSearchQuery(search: string) {
    const params = new URLSearchParams(search || '?');
    const res: QueryObj = { };
    params.forEach((value, key) => {
        if (key) {
            res[key] = value || true;
        }
    });
    return res;
}

export function createSearchQuery(args: QueryObj | null, addQuestionMark = false) {
    const res = createSearchParams(args);
    const str = res?.toString() || '';
    if (!str || !addQuestionMark) {
        return str;
    }

    return '?' + str;
}

export function createSearchParams(args: QueryObj | null): URLSearchParams | null {
    if (!args) {
        return null;
    }

    let res: URLSearchParams | null = null;
    Object.entries(args).forEach(([key, value]) => {
        if (typeof value === 'boolean' || typeof value === 'string' || typeof value === 'number') {
            if (!res) {
                res = new URLSearchParams();
            }

            res.set(key, value === true ? '' : value);
        }
    });
    return res;
}
