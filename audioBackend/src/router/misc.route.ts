import { Router } from "express";
import { getPreSignedUrlForImage } from "../controlers/misc.controller";

export const miscRouter = Router();

// Note: getPreSignedUrlForSongs moved to adminBackend
// miscRouter.get("/presigned-url/song", getPreSignedUrlForSongs);
miscRouter.get("/presigned-url/image", getPreSignedUrlForImage);
