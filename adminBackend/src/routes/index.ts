import { Router } from "express";
import { authRouter } from "./auth.routes";
import { artistRouter } from "./artist.routes";
import { playlistRoutes } from "./playlist.routes";
import { miscRouter } from "./misc.routes";
import { songRouter } from "./song.routes";
import { searchRouter } from "./search.routes";
import { userRouter } from "./user.routes";
import { authenticate } from "../middlewares";
import { authLimiter } from "../middlewares/rateLimiter.middleware";

export const masterRouter = Router();

masterRouter.use("/auth", authLimiter, authRouter);
masterRouter.use("/artists", authenticate, artistRouter);
masterRouter.use("/playlists", authenticate, playlistRoutes);
masterRouter.use("/misc", authenticate, miscRouter);
masterRouter.use("/songs", authenticate, songRouter);
masterRouter.use("/search", authenticate, searchRouter);
masterRouter.use("/users", authenticate, userRouter);
