import { Router } from "express";
import { getSongs, getSongById } from "../controllers/song.controller";

export const songRouter = Router();

songRouter.get("/", getSongs);
songRouter.get("/:id", getSongById);
