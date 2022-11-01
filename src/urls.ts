
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
