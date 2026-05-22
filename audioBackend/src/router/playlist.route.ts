import { Router } from "express";
import { playlistController } from "../infra";
import { secure } from "../middlewares/authenticate.middleware";
import { validate } from "../middlewares/validate.middleware";
import { z } from "zod";

export const playlistRouter = Router();

const paginationQuery = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

const idParam = z.object({
    id: z.string().min(1, "ID must not be empty"),
});

playlistRouter.get("/", validate({ query: paginationQuery }), playlistController.getPlaylists);
playlistRouter.get("/:id", validate({ params: idParam }), playlistController.getPlaylistById);
playlistRouter.get("/:id/songs", validate({ params: idParam, query: paginationQuery }), playlistController.getSongsOfPlaylist);
playlistRouter.delete("/:id", validate({ params: idParam }), playlistController.deletePlaylist);

