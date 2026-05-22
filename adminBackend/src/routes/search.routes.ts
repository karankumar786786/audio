import { Router } from "express";
import { unifiedSearch } from "../controllers/search.controller";
import { validate } from "../middlewares/validate.middleware";
import { z } from "zod";

export const searchRouter = Router();

const searchSchema = z.object({
    q: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

searchRouter.get("/", validate({ query: searchSchema }), unifiedSearch);

