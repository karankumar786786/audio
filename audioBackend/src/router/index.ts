import {Router} from "express";
import {userRouter} from "./user.route";
import {songRouter} from "./song.route";

export const masterRouter = Router();

masterRouter.use("/users", userRouter);
masterRouter.use("/songs", songRouter);