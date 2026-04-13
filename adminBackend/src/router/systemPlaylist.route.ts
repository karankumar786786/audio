import { Router } from "express";
import {
    createSystemPlaylist,
    deleteSystemPlaylist,
    addSongInSystemPlaylist,
    deleteSongInSystemPlaylist,
    getSystemPlaylists,
    getSystemPlaylistById,
    getSongsOfSystemPlaylist,
} from "../controllers/systemPlaylistController";
import { validate } from "../middlewares/validate.middleware";
import { systemPlaylistSchema, systemPlaylistSongSchema } from "../schema/systemPlaylist.schema";
import { z } from "zod";

const createSystemPlaylistInput = systemPlaylistSchema
    .omit({ id: true, createdAt: true, updatedAt: true })
    .extend({
        name: z.string({ error: "name is required" }).min(1, { message: "name cannot be empty" }),
        coverImageKey: z.string({ error: "coverImageKey is required" }).min(1, { message: "coverImageKey cannot be empty" }),
        bannerImageKey: z.string({ error: "bannerImageKey is required" }).min(1, { message: "bannerImageKey cannot be empty" }),
    });

const systemPlaylistSongInput = systemPlaylistSongSchema.omit({ id: true });

export const systemPlaylistRouter = Router();

systemPlaylistRouter.post("/", validate(createSystemPlaylistInput), createSystemPlaylist);
systemPlaylistRouter.get("/", getSystemPlaylists);
systemPlaylistRouter.post("/songs", validate(systemPlaylistSongInput), addSongInSystemPlaylist);
systemPlaylistRouter.delete("/songs", validate(systemPlaylistSongInput), deleteSongInSystemPlaylist);
systemPlaylistRouter.get("/:id", getSystemPlaylistById);
systemPlaylistRouter.get("/:id/songs", getSongsOfSystemPlaylist);
systemPlaylistRouter.delete("/:id", deleteSystemPlaylist);
