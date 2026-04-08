import {Router} from "express";
import {songRouter} from "./song.route";

export const masterRouter = Router();

masterRouter.use("/songs", songRouter);