import { Router } from "express";
import { 
    getPreSignedUrlForSongs, 
    getPreSignedUrlForImage,
    getYtInfo 
} from "../controllers/misc.controller";

export const miscRouter = Router();

miscRouter.get("/presigned-url/song", getPreSignedUrlForSongs);
miscRouter.get("/presigned-url/image", getPreSignedUrlForImage);
miscRouter.get("/yt-info", getYtInfo);
