import { Router } from "express";
import {
    createUser,
    addSongInUserFavourites,
    deleteSongInUserFavourites,
    getUserFavourites,
    getUserHistory,
    getUserSearchHistory,
    saveUserSearchHistory,
    clearUserSearchHistory,
} from "../controlers/user.controller";
import { validate } from "../middlewares/validate.middleware";
import { createUserSchema } from "../schema/user.schema";
import { userFavouriteSongSchema } from "../schema/userFavouriteSong.schema";
import { userSearchHistorySchema } from "../schema/userSearchHistory.schema";

const favouriteSongInput = userFavouriteSongSchema.pick({ userId: true, songId: true });
const searchHistoryInput = userSearchHistorySchema.pick({ userId: true, searchedText: true });

export const userRouter = Router();

// Create / upsert user (for testing & Auth0 post-login callback)
userRouter.post("/", validate(createUserSchema), createUser);

// Favourites
userRouter.post("/favourites", validate(favouriteSongInput), addSongInUserFavourites);
userRouter.delete("/favourites", validate(favouriteSongInput), deleteSongInUserFavourites);
userRouter.get("/:userId/favourites", getUserFavourites);

// Listen history
userRouter.get("/:userId/history", getUserHistory);

// Search history
userRouter.get("/:userId/search-history", getUserSearchHistory);
userRouter.post("/search-history", validate(searchHistoryInput), saveUserSearchHistory);
userRouter.delete("/:userId/search-history", clearUserSearchHistory);
