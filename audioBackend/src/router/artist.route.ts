import { Router } from "express";
import { artistController } from "../infra";
import { secure } from "../middlewares/authenticate.middleware";
import { validate } from "../middlewares/validate.middleware";
import { z } from "zod";

export const artistRouter = Router();

const paginationQuery = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

const idParam = z.object({
    id: z.string().min(1, "ID must not be empty"),
});

artistRouter.get("/", validate({ query: paginationQuery }), artistController.getArtists);
artistRouter.get("/:id", validate({ params: idParam }), artistController.getArtistById);
artistRouter.get("/:id/songs", validate({ params: idParam, query: paginationQuery }), artistController.getSongsOfArtist);
