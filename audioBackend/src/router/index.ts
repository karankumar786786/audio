import { Router } from "express";
import { songRouter } from "./song.route";
import { userRouter } from "./user.route";
import { interactionRouter } from "./interaction.route";
import { playlistRouter } from "./playlist.route";
import { artistRouter } from "./artist.route";
import { searchRouter } from "./search.route";
import { authRouter } from "./auth.route";
import { systemStatusController } from "../infra";

import { authLimiter } from "../middlewares/rateLimiter.middleware";

export const masterRouter = Router();

masterRouter.get("/status", systemStatusController.getStatus);

masterRouter.use("/auth", authLimiter, authRouter);
masterRouter.use("/songs", songRouter);
masterRouter.use("/users", userRouter);
masterRouter.use("/interactions", interactionRouter);
masterRouter.use("/playlists", playlistRouter);
masterRouter.use("/artists", artistRouter);
masterRouter.use("/search", searchRouter);