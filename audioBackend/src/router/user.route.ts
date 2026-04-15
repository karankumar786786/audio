import { Router } from "express";
import { userController } from "../infra";
import { validate } from "../middlewares/validate.middleware";
import { userFavouriteSongSchema } from "../schema/userFavouriteSong.schema";
import { userSearchHistorySchema } from "../schema/userSearchHistory.schema";
import { userPlaylistSchema, userPlaylistSongSchema } from "../schema/userPlaylist.schema";
import { z } from "zod";


const favouriteSongInput = userFavouriteSongSchema.pick({ userId: true, songId: true });
const searchHistoryInput = userSearchHistorySchema.pick({ userId: true, searchedText: true });
const createPlaylistInput = userPlaylistSchema.pick({ name: true, userId: true });
const playlistSongInput = userPlaylistSongSchema.pick({ playlistId: true, songId: true }).extend({
    userId: z.string().min(1, { message: "userId is required" })
});

export const userRouter = Router();

// Create / upsert user (for testing & Auth0 post-login callback)
userRouter.post("/register", userController.handleUser);
userRouter.get("/:id", userController.getUserById);

// Favourites
userRouter.post("/favourites", validate(favouriteSongInput), userController.addSongInUserFavourites);
userRouter.delete("/favourites", validate(favouriteSongInput), userController.deleteSongInUserFavourites);
userRouter.get("/:userId/favourites", userController.getUserFavourites);

// Listen history
userRouter.get("/:userId/history", userController.getUserHistory);

// Search history
userRouter.get("/:userId/search-history", userController.getUserSearchHistory);
userRouter.post("/search-history", validate(searchHistoryInput), userController.saveUserSearchHistory);
userRouter.delete("/:userId/search-history", userController.clearUserSearchHistory);

// Playlists
userRouter.post("/playlists", validate(createPlaylistInput), userController.createUserPlaylist);
userRouter.get("/:userId/playlists", userController.getUserPlaylists);
userRouter.post("/playlists/songs", validate(playlistSongInput), userController.addSongToUserPlaylist);
userRouter.delete("/playlists/songs", validate(playlistSongInput), userController.removeSongFromUserPlaylist);
userRouter.get("/playlists/:id/songs", userController.getUserPlaylistSongs);
userRouter.delete("/playlists/:id", userController.deleteUserPlaylist);
