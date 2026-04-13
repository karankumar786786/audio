import { Router } from "express";
import {
    getSystemPlaylists,
    getSystemPlaylistById,
    getSongsOfSystemPlaylist,
} from "../controlers/systemPlaylistController";

export const systemPlaylistRouter = Router();

systemPlaylistRouter.get("/", getSystemPlaylists);
systemPlaylistRouter.get("/:id", getSystemPlaylistById);
systemPlaylistRouter.get("/:id/songs", getSongsOfSystemPlaylist);
