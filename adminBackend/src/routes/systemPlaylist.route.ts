import { Router } from "express";
import {
    createSystemPlaylist,
    deleteSystemPlaylist,
    addSongInSystemPlaylist,
    deleteSongInSystemPlaylist,
    getSystemPlaylists,
    getSystemPlaylistById,
    getSongsOfSystemPlaylist,
} from "../controllers/systemPlaylistController";
import { validate } from "../middlewares/validate.middleware";
import { createSystemPlaylistInput, systemPlaylistSongInput } from "../schema/systemPlaylist.schema";



export const systemPlaylistRouter = Router();

systemPlaylistRouter.post("/", validate(createSystemPlaylistInput), createSystemPlaylist);
systemPlaylistRouter.get("/", getSystemPlaylists);
systemPlaylistRouter.post("/songs", validate(systemPlaylistSongInput), addSongInSystemPlaylist);
systemPlaylistRouter.delete("/songs", validate(systemPlaylistSongInput), deleteSongInSystemPlaylist);
systemPlaylistRouter.get("/:id", getSystemPlaylistById);
systemPlaylistRouter.get("/:id/songs", getSongsOfSystemPlaylist);
systemPlaylistRouter.delete("/:id", deleteSystemPlaylist);
