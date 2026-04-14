import * as fs from "node:fs";
import * as path from "node:path";
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StorageService } from "./index.types";
import type { Logger } from "../../observablity";


export class S3StorageService implements StorageService {
    private readonly logger: Logger;
    private readonly client: S3Client;

    constructor(region: string, accessKeyId: string, secretAccessKey: string, logger: Logger) {
        this.client = new S3Client({
            region,
            credentials: { accessKeyId, secretAccessKey },
            requestChecksumCalculation: "WHEN_SUPPORTED",
            responseChecksumValidation: "WHEN_SUPPORTED",
        });
        this.logger = logger;
    }

    async uploadObject(
        bucket: string,
        key: string,
        body: Buffer | NodeJS.ReadableStream | string,
        contentType?: string,
        maxRetries: number = 3
    ): Promise<void> {
        let lastError: any;
        const uploadBody = typeof body === "string" ? fs.createReadStream(body) : body;

        for (let i = 0; i < maxRetries; i++) {
            try {
                await this.client.send(new PutObjectCommand({
                    Bucket: bucket,
                    Key: key,
                    Body: uploadBody as any,
                    ContentType: contentType,
                    CacheControl: "no-transform"
                }));
                return;
            } catch (err: unknown) {
                lastError = err;
                const message = err instanceof Error ? err.message : String(err);
                this.logger.warn(err, `⚠️  Upload attempt ${i + 1} failed for ${key}: ${message}`);
                if (i < maxRetries - 1) {
                    await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
                }
            }
        }
        throw lastError;
    }

    async downloadObject(
        bucket: string,
        key: string,
        filePath: string,
        onProgress?: (progress: number) => void
    ): Promise<void> {
        const res = await this.client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        const totalSize = res.ContentLength || 0;
        let downloadedSize = 0;

        const stream = res.Body as NodeJS.ReadableStream;
        fs.mkdirSync(path.dirname(filePath), { recursive: true });

        await new Promise<void>((resolve, reject) => {
            const writer = fs.createWriteStream(filePath);

            stream.on("data", (chunk) => {
                downloadedSize += chunk.length;
                if (onProgress && totalSize > 0) {
                    const percentage = Math.round((downloadedSize / totalSize) * 100);
                    onProgress(percentage);
                }
            });

            stream.pipe(writer);
            writer.on("finish", () => {
                writer.close();
                resolve();
            });
            stream.on("error", (err) => {
                writer.close();
                reject(err);
            });
            writer.on("error", (err) => {
                writer.close();
                reject(err);
            });
        });
    }

    async deleteObject(bucket: string, key: string): Promise<void> {
        await this.client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    }

    getClient(): S3Client {
        return this.client;
    }

    async headObject(bucket: string, key: string): Promise<void> {
        const command = new HeadObjectCommand({
            Key: key,
            Bucket: bucket
        });
        await this.client.send(command);
    }

    async getPresignedUrl(bucket: string, key: string): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
        });
        return await getSignedUrl(this.client, command, { expiresIn: 60 * 5 });
    }
}
