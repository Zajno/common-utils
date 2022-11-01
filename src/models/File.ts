
export type FileMetadata = {
    name: string;

    /** size in bytes */
    size: number;

    /** refers to MIME type */
    type: string;

    format?: string;

    lang?: string;
};
