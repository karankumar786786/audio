import { Router } from "express";
import {
    createSystemPlaylist,
    deleteSystemPlaylist,
    addSongInSystemPlaylist,
    deleteSongInSystemPlaylist,
    getSystemPlaylists,
    getSystemPlaylistById,
    getSongsOfSystemPlaylist,
} from "../controlers/systemPlaylistController";

export const systemPlaylistRouter = Router();

systemPlaylistRouter.post("/", createSystemPlaylist);
systemPlaylistRouter.get("/", getSystemPlaylists);
systemPlaylistRouter.post("/songs", addSongInSystemPlaylist);
systemPlaylistRouter.delete("/songs", deleteSongInSystemPlaylist);
systemPlaylistRouter.get("/:id", getSystemPlaylistById);
systemPlaylistRouter.get("/:id/songs", getSongsOfSystemPlaylist);
systemPlaylistRouter.delete("/:id", deleteSystemPlaylist);
