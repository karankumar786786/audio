import { Router } from "express";
import {
    createSong,
    updateSong,
    deleteSong,
    getSongs,
    getJobStatus,
    createSongFromYoutube
} from "../controllers/song.controller";
import { validate } from "../middlewares/validate.middleware";
import { CreateSongSchema, updateSongSchema } from "../schema";

export const songRouter = Router();

songRouter.post("/", validate(CreateSongSchema), createSong);
songRouter.post("/youtube", createSongFromYoutube);
songRouter.get("/", getSongs);
songRouter.get("/jobs/:id", getJobStatus);
songRouter.put("/:id", validate(updateSongSchema), updateSong);
songRouter.delete("/:id", deleteSong);
