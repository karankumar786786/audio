import { Router } from "express";
import { getPreSignedUrlForImage } from "../controllers/misc.controller";

export const miscRouter = Router();

miscRouter.get("/presigned-url/image", getPreSignedUrlForImage);
