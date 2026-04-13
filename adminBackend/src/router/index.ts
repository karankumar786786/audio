import { Router } from "express";
import { artistRouter } from "./artist.route";
import { systemPlaylistRouter } from "./systemPlaylist.route";
import { miscRouter } from "./misc.route";
import { songRouter } from "./song.route";

export const masterRouter = Router();

masterRouter.use("/artists", artistRouter);
masterRouter.use("/systemplaylists", systemPlaylistRouter);
masterRouter.use("/misc", miscRouter);
masterRouter.use("/songs", songRouter);
