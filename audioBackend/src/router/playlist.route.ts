import { Router } from "express";
import {
    getPlaylists,
    getPlaylistById,
    getSongsOfPlaylist,
} from "../controlers/playlistController";

export const playlistRouter = Router();

playlistRouter.get("/", getPlaylists);
playlistRouter.get("/:id", getPlaylistById);
playlistRouter.get("/:id/songs", getSongsOfPlaylist);

