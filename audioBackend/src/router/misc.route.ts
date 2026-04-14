import { Router } from "express";
import { miscController } from "../infra";

export const miscRouter = Router();

miscRouter.get("/presigned-url/image", miscController.getPreSignedUrlForImage);
