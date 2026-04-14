import { Router } from "express";
import { playlistController } from "../infra";

export const playlistRouter = Router();

playlistRouter.get("/", playlistController.getPlaylists);
playlistRouter.get("/:id", playlistController.getPlaylistById);
playlistRouter.get("/:id/songs", playlistController.getSongsOfPlaylist);
