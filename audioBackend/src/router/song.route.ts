import { Router } from "express";
import { createSong } from "../controlers/song.controller";
import { validate } from "../middlewares/validate.middleware";
import { CreateSongSchema } from "../schema/songs.schema";

export const songRouter = Router();

songRouter.post(
    "/create",
    validate(CreateSongSchema),
    createSong
);
