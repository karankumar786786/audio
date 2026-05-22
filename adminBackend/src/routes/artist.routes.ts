import { Router } from "express";
import {
    createArtist,
    deleteArtist,
    getArtists,
    getArtistById,
    getSongsOfArtist,
    updateArtist,
} from "../controllers/artist.controller";
import { validate } from "../middlewares/validate.middleware";
import { createArtistSchema, updateArtistSchema } from "@onemelody/core";
import { z } from "zod";

export const artistRouter = Router();

const paginationQuery = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

const idParam = z.object({
    id: z.string().min(1, "ID must not be empty"),
});

artistRouter.post("/", validate(createArtistSchema), createArtist);
artistRouter.get("/", validate({ query: paginationQuery }), getArtists);
artistRouter.get("/:id", validate({ params: idParam }), getArtistById);
artistRouter.get("/:id/songs", validate({ params: idParam, query: paginationQuery }), getSongsOfArtist);
artistRouter.put("/:id", validate(updateArtistSchema), updateArtist);
artistRouter.delete("/:id", validate({ params: idParam }), deleteArtist);

