import { Router } from "express";
import { 
    getPreSignedUrlForSongs, 
    getPreSignedUrlForImage,
    getYtInfo 
} from "../controllers/misc.controller";
import { validate } from "../middlewares/validate.middleware";
import { z } from "zod";

export const miscRouter = Router();

const ytInfoQuerySchema = z.object({
    url: z.string().url("Valid YouTube URL is required"),
});

miscRouter.get("/presigned-url/song", getPreSignedUrlForSongs);
miscRouter.get("/presigned-url/image", getPreSignedUrlForImage);
miscRouter.get("/yt-info", validate({ query: ytInfoQuerySchema }), getYtInfo);

