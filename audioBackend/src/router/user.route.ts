import { Router } from "express";
import { userController } from "../infra";
import { validate } from "../middlewares/validate.middleware";
import { userFavouriteSongSchema } from "../schema/userFavouriteSong.schema";
import { userSearchHistorySchema } from "../schema/userSearchHistory.schema";
import { userPlaylistSchema, userPlaylistSongSchema } from "../schema/userPlaylist.schema";
import { z } from "zod";
import { secure } from "../middlewares/authenticate.middleware";


const favouriteSongInput = userFavouriteSongSchema.pick({ songId: true });
const searchHistoryInput = userSearchHistorySchema.pick({ searchedText: true });
const createPlaylistInput = userPlaylistSchema.pick({ name: true });
const playlistSongInput = userPlaylistSongSchema.pick({ playlistId: true, songId: true });

export const userRouter = Router();

// Create / upsert user (for testing & Auth0 post-login callback)
userRouter.post("/register", userController.handleUser);
// Favourites
userRouter.post("/favourites", secure, validate(favouriteSongInput), userController.addSongInUserFavourites);
userRouter.delete("/favourites", secure, validate(favouriteSongInput), userController.deleteSongInUserFavourites);
userRouter.get("/favourites", secure, userController.getUserFavourites);

// Listen history
userRouter.get("/history", secure, userController.getUserHistory);

// Search history
userRouter.get("/search-history", secure, userController.getUserSearchHistory);
userRouter.post("/search-history", secure, validate(searchHistoryInput), userController.saveUserSearchHistory);
userRouter.delete("/search-history", secure, userController.clearUserSearchHistory);

// Playlists
userRouter.post("/playlists", secure, validate(createPlaylistInput), userController.createUserPlaylist);
userRouter.get("/playlists", secure, userController.getUserPlaylists);
userRouter.post("/playlists/songs", secure, validate(playlistSongInput), userController.addSongToUserPlaylist);
userRouter.delete("/playlists/songs", secure, validate(playlistSongInput), userController.removeSongFromUserPlaylist);
userRouter.get("/playlists/:id", secure, userController.getUserPlaylistById);
userRouter.get("/playlists/:id/songs", secure, userController.getUserPlaylistSongs);
userRouter.delete("/playlists/:id", secure, userController.deleteUserPlaylist);

userRouter.get("/:id", secure,userController.getUserById);
