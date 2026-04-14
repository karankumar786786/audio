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
import { createPlaylistInput, playlistSongInput } from "../schema/playlist.schema";

export const playlistRoutes = Router();

playlistRoutes.post("/", validate(createPlaylistInput), createPlaylist);
playlistRoutes.get("/", getPlaylists);
playlistRoutes.post("/songs", validate(playlistSongInput), addSongInPlaylist);
playlistRoutes.delete("/songs", validate(playlistSongInput), deleteSongInPlaylist);
playlistRoutes.get("/:id", getPlaylistById);
playlistRoutes.get("/:id/songs", getSongsOfPlaylist);
playlistRoutes.delete("/:id", deletePlaylist);

