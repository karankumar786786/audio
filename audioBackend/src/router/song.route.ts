import { Router } from "express";
import { songController } from "../infra";

export const songRouter = Router();

songRouter.get("/", songController.getSongs);
songRouter.get("/:id", songController.getSongById);
