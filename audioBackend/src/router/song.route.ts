import { Router } from "express";
import { songController } from "../infra";
import { secure } from "../middlewares/authenticate.middleware";
import { validate } from "../middlewares/validate.middleware";
import { z } from "zod";

export const songRouter = Router();

const paginationQuery = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

const idParam = z.object({
    id: z.string().min(1, "ID must not be empty"),
});

songRouter.get("/", validate({ query: paginationQuery }), songController.getSongs);
songRouter.get("/:id", validate({ params: idParam }), songController.getSongById);
