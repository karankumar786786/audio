import { type Request, type Response, type NextFunction } from "express";
import { signatureService, storageService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";


export async function getPreSignedUrlForSongs(req:Request,res:Response,next:NextFunction) {
    try {
        const tempKey = signatureService.generateSignedId();
        const url = storageService.getPresignedUrl(process.env.TEMP_BUCKET_NAME!,tempKey);
        return res.json(new ApiResponse(200,"url generated sucessfully",{tempKey,url}));
    } catch (error) {
        
    }

}

export async function getPreSignedUlrForImage(req:Request,res:Response,next:NextFunction) {
    
}
