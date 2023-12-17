export function prepareEmail(email: string): string;
export function prepareEmail(email: '' | null | undefined): null;
export function prepareEmail(email: string | null | undefined): string | null;

export function prepareEmail(email: string | null | undefined): string | null {
    if (!email) {
        return null;
    }

    return email.toLowerCase()
        .replace(/ /gi, '');
}
