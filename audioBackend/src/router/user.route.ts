import { Router } from "express";
import { userController } from "../infra";
import { validate } from "../middlewares/validate.middleware";
import { userFavouriteSongSchema } from "../schema/userFavouriteSong.schema";
import { userSearchHistorySchema } from "../schema/userSearchHistory.schema";
import { userPlaylistSchema, userPlaylistSongSchema } from "../schema/userPlaylist.schema";
import { z } from "zod";
import { secure } from "../middlewares/authenticate.middleware";


const favouriteSongInput = userFavouriteSongSchema.pick({ userId: true, songId: true });
const searchHistoryInput = userSearchHistorySchema.pick({ userId: true, searchedText: true });
const createPlaylistInput = userPlaylistSchema.pick({ name: true, userId: true });
const playlistSongInput = userPlaylistSongSchema.pick({ playlistId: true, songId: true }).extend({
    userId: z.string().min(1, { message: "userId is required" })
});

export const userRouter = Router();

// Create / upsert user (for testing & Auth0 post-login callback)
userRouter.post("/register", userController.handleUser);
userRouter.get("/:id", secure,userController.getUserById);

// Favourites
userRouter.post("/favourites", secure,validate(favouriteSongInput), userController.addSongInUserFavourites);
userRouter.delete("/favourites", secure,validate(favouriteSongInput), userController.deleteSongInUserFavourites);
userRouter.get("/:userId/favourites", secure,userController.getUserFavourites);

// Listen history
userRouter.get("/:userId/history", secure,userController.getUserHistory);

// Search history
userRouter.get("/:userId/search-history", secure,userController.getUserSearchHistory);
userRouter.post("/search-history", secure,validate(searchHistoryInput), userController.saveUserSearchHistory);
userRouter.delete("/:userId/search-history",secure, userController.clearUserSearchHistory);

// Playlists
userRouter.post("/playlists", secure,validate(createPlaylistInput), userController.createUserPlaylist);
userRouter.get("/:userId/playlists", secure,userController.getUserPlaylists);
userRouter.post("/playlists/songs", secure,validate(playlistSongInput), userController.addSongToUserPlaylist);
userRouter.delete("/playlists/songs", secure,validate(playlistSongInput), userController.removeSongFromUserPlaylist);
userRouter.get("/playlists/:id/songs", secure,userController.getUserPlaylistSongs);
userRouter.delete("/playlists/:id", secure,userController.deleteUserPlaylist);
