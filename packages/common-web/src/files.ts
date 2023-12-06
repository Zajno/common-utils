import { FileMetadata } from '@zajno/common/models/File';

export enum FileTypes {
    Image,
    Audio,
    Document,
    Spreadsheet,
    Presentation,
}

/** Can be updated outside */
export const FileSupportedExtensions: Record<FileTypes, string[]> = {
    [FileTypes.Audio]: ['mp3', 'wav'],
    [FileTypes.Image]: ['png', 'jpeg', 'jpg', 'gif', 'svg', 'heic'],
    [FileTypes.Document]: ['pdf', 'doc', 'docx'],
    [FileTypes.Spreadsheet]: ['xlsx', 'csv'],
    [FileTypes.Presentation]: ['ppt', 'pptx'],
};

export const MaxUploadFileSizeMB = 100;

export function getFileExtension(file: File): string {
    const filename = file?.name || '';
    const lastDot = filename.lastIndexOf('.');
    if (lastDot < 0) {
        return null;
    }

    return filename.substring(lastDot + 1).toLowerCase();
}

export function validateFileExtension(file: File, whitelist: (string | FileTypes)[]): boolean {
    const ext = getFileExtension(file);
    return whitelist?.some(e => {
        if (typeof e === 'string') {
            return e === ext;
        }

        const supported = FileSupportedExtensions[e];
        return supported.includes(ext);
    });
}

export function validateFileSize(file: File, maxSizeMB = MaxUploadFileSizeMB): boolean {
    return file.size * 0.0000010 <= maxSizeMB; // <= 100MB
}

export function humanFileSize(bytes: number, si = false, dp = 1) {
    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }

    const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10 ** dp;

    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

    return bytes.toFixed(dp) + ' ' + units[u];
}

export function getFileMetaData(file: File): FileMetadata {
    const result: FileMetadata = {
        name: file.name,
        size: file.size,
        type: file.type,
    };

    return result;
}

export function formatExtensions(list: (string | FileTypes)[]): string {
    return Array.from(
        new Set<string>(
            list.reduce((res, item) => {
                if (typeof item === 'string') {
                    res.push(item);
                } else {
                    res.push(...FileSupportedExtensions[item]);
                }
                return res;
            }, [])
        )).map(e => '.' + e).join(', ');
}
