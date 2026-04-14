import { type Request, type Response, type NextFunction } from "express";
import { signatureService, storageService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { imagekitClient } from "../infra";

/**
 * Controller for miscellaneous operations like generating pre-signed URLs.
 */

export async function getPreSignedUrlForSongs(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
        const tempKey: string = signatureService.generateSignedId();
        const url: string = await storageService.getPresignedUrl(process.env.TEMP_BUCKET_NAME!, tempKey);
        return res.json(new ApiResponse(200, "URL generated successfully", { tempKey, url }));
    } catch (error: any) {
        next(error);
    }
}

export async function getPreSignedUrlForImage(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
        const tempKey: string = signatureService.generateSignedId();
        const authParams: { token: string, expire: number, signature: string, } = imagekitClient.getAuthenticationParameters();
        return res.json(new ApiResponse(200, "URL generated successfully", { tempKey, ...authParams }));
    } catch (error: any) {
        next(error);
    }
}
