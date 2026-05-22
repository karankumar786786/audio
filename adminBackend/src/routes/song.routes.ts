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
import { CreateSongSchema, updateSongSchema } from "@onemelody/core";
import { z } from "zod";

export const songRouter = Router();

const youtubeInputSchema = z.object({
    ytUrl: z.string().url("Valid YouTube URL is required"),
    title: z.string().min(1, "Title is required"),
    artistName: z.string().min(1, "Artist name is required"),
});

const paginationQuery = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

const idParam = z.object({
    id: z.string().min(1, "ID must not be empty"),
});

songRouter.post("/", validate(CreateSongSchema), createSong);
songRouter.post("/youtube", validate(youtubeInputSchema), createSongFromYoutube);
songRouter.get("/", validate({ query: paginationQuery }), getSongs);
songRouter.get("/jobs/:id", validate({ params: idParam }), getJobStatus);
songRouter.put("/:id", validate(updateSongSchema), updateSong);
songRouter.delete("/:id", validate({ params: idParam }), deleteSong);

