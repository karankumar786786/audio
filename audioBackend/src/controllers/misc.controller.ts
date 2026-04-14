import { type Request, type Response } from "express";
import { type SignatureService } from "../lib/signature";
import { type StorageService } from "../lib/storage";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { logMethods, type Logger } from "../observability";
import ImageKit from "imagekit";

/**
 * Controller for miscellaneous operations like generating pre-signed URLs.
 */
export class MiscController {
    constructor(
        private readonly signatureService: SignatureService,
        private readonly storageService: StorageService,
        private readonly imagekitClient: ImageKit,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    getPreSignedUrlForImage = asyncHandler(async (_req: Request, res: Response) => {
        const tempKey = this.signatureService.generateSignedId();
        const authParams = this.imagekitClient.getAuthenticationParameters();
        return res.json(new ApiResponse(200, "URL generated successfully", { tempKey, ...authParams }));
    });
}
