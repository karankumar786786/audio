import { type Request, type Response, type NextFunction } from "express";
import { signatureService, storageService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import {imagekitClient} from "../infra";

/**
 * Controller for miscellaneous operations like generating pre-signed URLs.
 */

// Note: getPreSignedUrlForSongs moved to adminBackend

export async function getPreSignedUrlForImage(req: Request, res: Response, next: NextFunction) {
    try {
        const tempKey = signatureService.generateSignedId();
        const authParams = imagekitClient.getAuthenticationParameters();
        return res.json(new ApiResponse(200, "URL generated successfully", { tempKey, ...authParams }));
    } catch (error: any) {
        next(error);
    }
}
