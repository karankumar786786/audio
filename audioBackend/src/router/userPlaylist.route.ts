import { Router } from "express";
import {
    createUserPlaylist,
    deleteUserPlaylist,
    addSongInUserPlaylist,
    deleteSongInUserPlaylist,
    getUserPlaylists,
    getUserPlaylistSongs,
} from "../controllers/user-playlist.controller";
import { validate } from "../middlewares/validate.middleware";
import { userPlaylistSchema, userPlaylistSongSchema } from "../schema/userPlaylist.schema";
import { z } from "zod";

const createPlaylistInput = userPlaylistSchema.pick({ name: true, userId: true });
const playlistSongInput = userPlaylistSongSchema.pick({ playlistId: true, songId: true }).extend({
    userId: z.string({error:"userId is required"}).min(1, { message: "userId is required" })
});

export const userPlaylistRouter = Router();

userPlaylistRouter.post("/", validate(createPlaylistInput), createUserPlaylist);
userPlaylistRouter.get("/user/:userId", getUserPlaylists);
userPlaylistRouter.post("/songs", validate(playlistSongInput), addSongInUserPlaylist);
userPlaylistRouter.delete("/songs", validate(playlistSongInput), deleteSongInUserPlaylist);
userPlaylistRouter.get("/:id/songs", getUserPlaylistSongs);
userPlaylistRouter.delete("/:id", deleteUserPlaylist);
