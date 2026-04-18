import { logMethods, type Logger } from "../observablity";
import type { StorageService } from "../lib/storage";
import type ImageKit from "imagekit";
import type { SignatureService } from "../lib/signature";
import { spawn } from "child_process";
import path from "path";

export class MiscService {
    private readonly ytDlpPath: string;

    constructor(
        private readonly logger: Logger,
        private readonly storageService: StorageService,
        private readonly imageKitClient: ImageKit,
        private readonly signatureService: SignatureService,
    ) {
        logMethods(this, this.logger);
        this.ytDlpPath = path.resolve(process.cwd(), "bin/yt-dlp");
    }

    private async runYtDlp(args: string[]): Promise<any> {
        return new Promise((resolve, reject) => {
            const child = spawn(this.ytDlpPath, args);
            let stdout = "";
            let stderr = "";

            child.stdout.on("data", (data) => { stdout += data; });
            child.stderr.on("data", (data) => { stderr += data; });

            child.on("close", (code) => {
                if (code !== 0) {
                    this.logger.error({ code, stderr }, "yt-dlp execution failed");
                    return reject(new Error(`yt-dlp failed with code ${code}`));
                }
                try {
                    resolve(JSON.parse(stdout));
                } catch (e) {
                    reject(new Error("Failed to parse yt-dlp output"));
                }
            });
        });
    }

    async getYoutubeInfo(url: string): Promise<{ title?: string, thumbnail?: string }> {
        this.logger.debug({ url }, "getYoutubeInfo starting");
        try {
            const info = await this.runYtDlp([url, "--dump-single-json", "--no-check-certificates", "--no-warnings"]);
            return {
                title: info.title,
                thumbnail: info.thumbnail,
            };
        } catch (error: any) {
            this.logger.error(error, `Failed to fetch YouTube info for URL: ${url}`);
            throw error;
        }
    }

    async getPresignedUrlSong(): Promise<{ key: string, url: string }> {
        this.logger.debug("getPresignedUrlSong starting");
        const tempKey: string = this.signatureService.generateSignedId();
        const url: string = await this.storageService.getPresignedUrl(process.env.TEMP_BUCKET_NAME!, tempKey);
        this.logger.info({ key: tempKey }, "presigned URL for song generated");
        return {
            key: tempKey,
            url: url
        }
    }
    async getPresignedUrlImage(): Promise<{ token: string, expire: number, signature: string, tempKey: string }> {
        this.logger.debug("getPresignedUrlImage starting");
        const tempKey: string = this.signatureService.generateSignedId();
        const authParams = this.imageKitClient.getAuthenticationParameters();
        this.logger.info({ key: tempKey }, "presigned URL for image generated");
        return {
            tempKey,
            ...authParams
        }
    }
}