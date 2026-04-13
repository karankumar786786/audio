import { Router } from "express";
import { 
    createSong, 
    updateSong, 
    deleteSong, 
    getSongs, 
    getSongById 
} from "../controllers/song.controller";
import { validate } from "../middlewares/validate.middleware";
import { CreateSongSchema } from "../schema/songs.schema";

export const songRouter = Router();

songRouter.post("/", validate(CreateSongSchema), createSong);
songRouter.get("/", getSongs);
songRouter.get("/:id", getSongById);
songRouter.put("/:id", validate(CreateSongSchema.partial()), updateSong);
songRouter.delete("/:id", deleteSong);
