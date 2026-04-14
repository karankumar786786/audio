import { Router } from "express";
import {
    getPlaylists,
    getPlaylistById,
    getSongsOfPlaylist,
} from "../controllers/playlist.controller";

export const playlistRouter = Router();

playlistRouter.get("/", getPlaylists);
playlistRouter.get("/:id", getPlaylistById);
playlistRouter.get("/:id/songs", getSongsOfPlaylist);

