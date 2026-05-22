import { Router } from "express";
import { userController } from "../infra";
import { validate } from "../middlewares/validate.middleware";
import { userFavouriteSongSchema, userSearchHistorySchema, userPlaylistSchema, userPlaylistSongSchema } from "@onemelody/core";
import { secure } from "../middlewares/authenticate.middleware";
import { z } from "zod";

const paginationQuery = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

const idParam = z.object({
    id: z.string().min(1, "ID must not be empty"),
});

const registerInput = z.object({
    accessToken: z.string().optional(),
});

const favouriteSongInput = userFavouriteSongSchema.pick({ songId: true });
const searchHistoryInput = userSearchHistorySchema.pick({ searchedText: true });
const createPlaylistInput = userPlaylistSchema.pick({ name: true });
const playlistSongInput = userPlaylistSongSchema.pick({ playlistId: true, songId: true });

export const userRouter = Router();

// Create / upsert user (for testing & Auth0 post-login callback)
userRouter.post("/register", validate(registerInput), userController.handleUser);
// Favourites
userRouter.post("/favourites", secure, validate(favouriteSongInput), userController.addSongInUserFavourites);
userRouter.delete("/favourites", secure, validate(favouriteSongInput), userController.deleteSongInUserFavourites);
userRouter.get("/favourites", secure, validate({ query: paginationQuery }), userController.getUserFavourites);

// Listen history
userRouter.get("/history", secure, validate({ query: paginationQuery }), userController.getUserHistory);

// Search history
userRouter.get("/search-history", secure, validate({ query: paginationQuery }), userController.getUserSearchHistory);
userRouter.post("/search-history", secure, validate(searchHistoryInput), userController.saveUserSearchHistory);
userRouter.delete("/search-history", secure, userController.clearUserSearchHistory);

// Playlists
userRouter.post("/playlists", secure, validate(createPlaylistInput), userController.createUserPlaylist);
userRouter.get("/playlists", secure, validate({ query: paginationQuery }), userController.getUserPlaylists);
userRouter.post("/playlists/songs", secure, validate(playlistSongInput), userController.addSongToUserPlaylist);
userRouter.delete("/playlists/songs", secure, validate(playlistSongInput), userController.removeSongFromUserPlaylist);
userRouter.get("/playlists/:id", secure, validate({ params: idParam }), userController.getUserPlaylistById);
userRouter.get("/playlists/:id/songs", secure, validate({ params: idParam, query: paginationQuery }), userController.getUserPlaylistSongs);
userRouter.delete("/playlists/:id", secure, validate({ params: idParam }), userController.deleteUserPlaylist);

userRouter.get("/:id", secure, validate({ params: idParam }), userController.getUserById);

