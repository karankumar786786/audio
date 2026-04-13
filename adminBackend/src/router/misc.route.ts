import { Router } from "express";
import { getPreSignedUrlForSongs, getPreSignedUrlForImage } from "../controllers/misc.controller";

export const miscRouter = Router();

miscRouter.get("/presigned-url/song", getPreSignedUrlForSongs);
miscRouter.get("/presigned-url/image", getPreSignedUrlForImage);
