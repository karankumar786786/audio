import type { Logger } from "inngest";
import type { StorageService } from "../lib/storage";
import type ImageKit from "imagekit";
import type { SignatureService } from "../lib/signature";

export class MiscService {
    /**
     *
     */
    constructor(
        private readonly logger: Logger,
        private readonly storageService: StorageService,
        private readonly imageKitClient: ImageKit,
        private readonly signatureService: SignatureService,
    ) {
    }

    async getPresignedUrlSong(): Promise<{ key: string, url: string }> {
        const tempKey: string = this.signatureService.generateSignedId();
        const url: string = await this.storageService.getPresignedUrl(process.env.TEMP_BUCKET_NAME!, tempKey);
        return {
            key: tempKey,
            url: url
        }
    }

    async getPresignedUrlImage(): Promise<{ token: string, expire: number, signature: string, tempKey: string }> {
        const tempKey: string = this.signatureService.generateSignedId();
        const authParams: { token: string, expire: number, signature: string, } = this.imageKitClient.getAuthenticationParameters();
        return {
            tempKey,
            ...authParams
        }
    }

}