import { Router } from "express";
import { songRouter } from "./song.route";
import { userRouter } from "./user.route";
import { interactionRouter } from "./interaction.route";
import { systemPlaylistRouter } from "./systemPlaylist.route";
import { userPlaylistRouter } from "./userPlaylist.route";
import { artistRouter } from "./artist.route";

export const masterRouter = Router();

masterRouter.use("/songs", songRouter);
masterRouter.use("/users", userRouter);
masterRouter.use("/interactions", interactionRouter);
masterRouter.use("/system-playlists", systemPlaylistRouter);
masterRouter.use("/playlists", userPlaylistRouter);
masterRouter.use("/artists", artistRouter);