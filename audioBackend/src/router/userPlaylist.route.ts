import { Router } from "express";
import { userPlaylistController } from "../infra";
import { validate } from "../middlewares/validate.middleware";
import { userPlaylistSchema, userPlaylistSongSchema } from "../schema/userPlaylist.schema";
import { z } from "zod";

const createPlaylistInput = userPlaylistSchema.pick({ name: true, userId: true });
const playlistSongInput = userPlaylistSongSchema.pick({ playlistId: true, songId: true }).extend({
    userId: z.string().min(1, { message: "userId is required" })
});

export const userPlaylistRouter = Router();

userPlaylistRouter.post("/", validate(createPlaylistInput), userPlaylistController.createPlaylist);
userPlaylistRouter.get("/user/:userId", userPlaylistController.getUserPlaylists);
userPlaylistRouter.post("/songs", validate(playlistSongInput), userPlaylistController.addSongToPlaylist);
userPlaylistRouter.delete("/songs", validate(playlistSongInput), userPlaylistController.removeSongFromPlaylist);
userPlaylistRouter.get("/:id/songs", userPlaylistController.getPlaylistSongs);
userPlaylistRouter.delete("/:id", userPlaylistController.deletePlaylist);
