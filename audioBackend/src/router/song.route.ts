import { Router } from "express";
import { songController } from "../infra";
import { secure } from "../middlewares/authenticate.middleware";

export const songRouter = Router();

songRouter.get("/", songController.getSongs);
songRouter.get("/:id", songController.getSongById);
