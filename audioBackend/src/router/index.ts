import { Router } from "express";
import { songRouter } from "./song.route";
import { userRouter } from "./user.route";
import { interactionRouter } from "./interaction.route";
import { playlistRouter } from "./playlist.route";
import { userPlaylistRouter } from "./userPlaylist.route";
import { artistRouter } from "./artist.route";
import { searchRouter } from "./search.route";
import { miscRouter } from "./misc.route";

export const masterRouter = Router();

masterRouter.use("/songs", songRouter);
masterRouter.use("/users", userRouter);
masterRouter.use("/interactions", interactionRouter);
masterRouter.use("/playlists", playlistRouter);
masterRouter.use("/user-playlists", userPlaylistRouter);
masterRouter.use("/artists", artistRouter);
masterRouter.use("/search", searchRouter);
masterRouter.use("/misc", miscRouter);