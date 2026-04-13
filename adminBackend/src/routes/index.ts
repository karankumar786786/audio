import { Router } from "express";
import { artistRouter } from "./artist.route";
import { playlistRoutes } from "./playlist.route";
import { miscRouter } from "./misc.route";
import { songRouter } from "./song.route";

export const masterRouter = Router();

masterRouter.use("/artists", artistRouter);
masterRouter.use("/playlists", playlistRoutes);
masterRouter.use("/misc", miscRouter);
masterRouter.use("/songs", songRouter);
