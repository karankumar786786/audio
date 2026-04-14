import { logMethods, type Logger } from "../observablity";
import type { StorageService } from "../lib/storage";
import type ImageKit from "imagekit";
import type { SignatureService } from "../lib/signature";

export class MiscService {
    constructor(
        private readonly logger: Logger,
        private readonly storageService: StorageService,
        private readonly imageKitClient: ImageKit,
        private readonly signatureService: SignatureService,
    ) {
        logMethods(this, this.logger);
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