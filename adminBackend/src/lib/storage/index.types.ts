export interface StorageService {
    uploadObject(
        bucket: string,
        key: string,
        body: Buffer | NodeJS.ReadableStream | string,
        contentType?: string,
        maxRetries?: number
    ): Promise<void>;

    downloadObject(
        bucket: string,
        key: string,
        filePath: string,
        onProgress?: (progress: number) => void
    ): Promise<void>;

    deleteObject(bucket: string, key: string): Promise<void>;

    headObject(bucket: string, key: string): Promise<void>;

    getPresignedUrl(bucket: string, key: string): Promise<string>;

    getClient(): unknown;
}
