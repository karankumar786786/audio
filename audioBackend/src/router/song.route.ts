import { Router } from "express";
import { createSong, updateSong, deleteSong, getSongs, getSongById, searchSongs } from "../controlers/song.controller";
import { validate } from "../middlewares/validate.middleware";
import { CreateSongSchema } from "../schema/songs.schema";

export const songRouter = Router();

songRouter.post("/create", validate(CreateSongSchema), createSong);
songRouter.get("/", getSongs);
songRouter.get("/search", searchSongs);
songRouter.get("/:id", getSongById);
songRouter.put("/:id", updateSong);
songRouter.delete("/:id", deleteSong);
