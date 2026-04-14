import { Router } from "express";
import { 
    createSong, 
    updateSong, 
    deleteSong, 
    getSongs, 
} from "../controllers/song.controller";
import { validate } from "../middlewares/validate.middleware";
import { CreateSongSchema, updateSongSchema } from "../schema";

export const songRouter = Router();

songRouter.post("/", validate(CreateSongSchema), createSong);
songRouter.get("/", getSongs);
songRouter.put("/:id", validate(updateSongSchema), updateSong);
songRouter.delete("/:id", deleteSong);
