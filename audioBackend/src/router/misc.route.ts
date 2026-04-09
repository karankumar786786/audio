import { Router } from "express";
import { getPreSignedUrlForSongs, getPreSignedUrlForImage } from "../controlers/misc.controller";

export const miscRouter = Router();

miscRouter.get("/presigned-url/song", getPreSignedUrlForSongs);
miscRouter.get("/presigned-url/image", getPreSignedUrlForImage);
