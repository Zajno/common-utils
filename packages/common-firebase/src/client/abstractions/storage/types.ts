
export type FileUploadResult = {
    ref: string,
    size: number,
};

export type ProgressListener = (progress: number) => void;

export interface IFirebaseStorage {
    getFileDownloadUlr(refPath: string): Promise<string | null>;

    uploadFileFromLocalUri(uri: string, storagePath: string, progress?: ProgressListener): Promise<FileUploadResult>;
    uploadFileFromBlob(blobOrDataUrl: Blob | string, storagePath: string, progress?: ProgressListener): Promise<FileUploadResult>;

    generateFileNameByDate(dotExtension: string, nowFormatted?: string): string;
}
