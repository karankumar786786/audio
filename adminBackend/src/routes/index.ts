import { Router } from "express";
import { artistRouter } from "./artist.routes";
import { playlistRoutes } from "./playlist.routes";
import { miscRouter } from "./misc.routes";
import { songRouter } from "./song.routes";
import { searchRouter } from "./search.routes";

export const masterRouter = Router();

masterRouter.use("/artists", artistRouter);
masterRouter.use("/playlists", playlistRoutes);
masterRouter.use("/misc", miscRouter);
masterRouter.use("/songs", songRouter);
masterRouter.use("/search", searchRouter);
