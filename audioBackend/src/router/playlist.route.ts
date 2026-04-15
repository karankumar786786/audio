import { Router } from "express";
import { playlistController } from "../infra";
import { secure } from "../middlewares/authenticate.middleware";

export const playlistRouter = Router();

playlistRouter.get("/", secure,playlistController.getPlaylists);
playlistRouter.get("/:id",secure, playlistController.getPlaylistById);
playlistRouter.get("/:id/songs", secure,playlistController.getSongsOfPlaylist);
