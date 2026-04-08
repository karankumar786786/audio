import { Router } from "express";
import { songController } from "../controlers/song.controller";
import { validate } from "../middlewares/validate.middleware";
import { CreateSongSchema } from "../schema/songs.schema";

export const songRouter = Router();

songRouter.post(
    "/create",
    validate(CreateSongSchema),
    (req, res, next) => songController.createSong(req, res, next)
);
