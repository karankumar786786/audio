import { Router } from "express";
import { searchController } from "../infra";
import { secure } from "../middlewares/authenticate.middleware";
import { validate } from "../middlewares/validate.middleware";
import { z } from "zod";

export const searchRouter = Router();

const searchSchema = z.object({
    q: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

searchRouter.get("/", validate({ query: searchSchema }), searchController.unifiedSearch);
