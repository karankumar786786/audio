import { Router } from "express";
import {
    createPlaylist,
    deletePlaylist,
    addSongInPlaylist,
    deleteSongInPlaylist,
    getPlaylists,
    getPlaylistById,
    getSongsOfPlaylist,
} from "../controllers/playlist.controller";
import { validate } from "../middlewares/validate.middleware";
import { createPlaylistInput, playlistSongInput } from "@onemelody/core";
import { z } from "zod";

export const playlistRoutes = Router();

const paginationQuery = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

const idParam = z.object({
    id: z.string().min(1, "ID must not be empty"),
});

playlistRoutes.post("/", validate(createPlaylistInput), createPlaylist);
playlistRoutes.get("/", validate({ query: paginationQuery }), getPlaylists);
playlistRoutes.post("/songs", validate(playlistSongInput), addSongInPlaylist);
playlistRoutes.delete("/songs", validate(playlistSongInput), deleteSongInPlaylist);
playlistRoutes.get("/:id", validate({ params: idParam }), getPlaylistById);
playlistRoutes.get("/:id/songs", validate({ params: idParam, query: paginationQuery }), getSongsOfPlaylist);
playlistRoutes.delete("/:id", validate({ params: idParam }), deletePlaylist);

