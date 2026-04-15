import { Router } from "express";
import { playlistController } from "../infra";
import { secure } from "../middlewares/authenticate.middleware";

export const playlistRouter = Router();

playlistRouter.get("/", playlistController.getPlaylists);
playlistRouter.get("/:id", playlistController.getPlaylistById);
playlistRouter.get("/:id/songs", playlistController.getSongsOfPlaylist);
