import { type Request, type Response, } from "express";
import { miscService, } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";


export const getPreSignedUrlForSongs = asyncHandler(async (req: Request, res: Response) => {
    const data:{ key: string, url: string } = await miscService.getPresignedUrlSong();
    return new ApiResponse<{ key: string, url: string }>(200, "URL generated successfully", data).send(res);
})

export const getPreSignedUrlForImage = asyncHandler(async (req:Request,res:Response) => {
    const data:{ token: string, expire: number, signature: string, tempKey: string } = await miscService.getPresignedUrlImage();
    return new ApiResponse<{ token: string, expire: number, signature: string, tempKey: string }>(200, "URL generated successfully", data).send(res);
})

