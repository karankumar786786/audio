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

systemPlaylistRouter.post("/create", createSystemPlaylist);
systemPlaylistRouter.get("/", getSystemPlaylists);
systemPlaylistRouter.get("/:id", getSystemPlaylistById);
systemPlaylistRouter.get("/:id/songs", getSongsOfSystemPlaylist);
systemPlaylistRouter.delete("/:id", deleteSystemPlaylist);
systemPlaylistRouter.post("/songs", addSongInSystemPlaylist);
systemPlaylistRouter.delete("/songs", deleteSongInSystemPlaylist);
