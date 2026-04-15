import { Router } from "express";
import { songRouter } from "./song.route";
import { userRouter } from "./user.route";
import { interactionRouter } from "./interaction.route";
import { playlistRouter } from "./playlist.route";
import { artistRouter } from "./artist.route";
import { searchRouter } from "./search.route";
import { systemStatusController } from "../infra";

export const masterRouter = Router();

masterRouter.get("/status", systemStatusController.getStatus);

masterRouter.use("/songs", songRouter);
masterRouter.use("/users", userRouter);
masterRouter.use("/interactions", interactionRouter);
masterRouter.use("/playlists", playlistRouter);
masterRouter.use("/artists", artistRouter);
masterRouter.use("/search", searchRouter);