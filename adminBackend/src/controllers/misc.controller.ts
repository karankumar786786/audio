import { type Request, type Response, } from "express";
import { miscService, } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";


export const getPreSignedUrlForSongs = asyncHandler(async (req: Request, res: Response) => {
    const data = await miscService.getPresignedUrlSong();
    return new ApiResponse(200, "URL generated successfully", data).send(res);
})

export const getPreSignedUrlForImage = asyncHandler(async (req:Request,res:Response) => {
    const data = await miscService.getPresignedUrlImage();
    return new ApiResponse(200, "URL generated successfully", data).send(res);
})

