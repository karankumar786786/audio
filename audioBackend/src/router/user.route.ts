import { Router } from "express";
import {
    addSongInUserFavourites,
    deleteSongInUserFavourites,
    getUserFavourites,
    getUserHistory,
    getUserSearchHistory,
    saveUserSearchHistory,
    clearUserSearchHistory,
} from "../controlers/user.controller";

export const userRouter = Router();

// Favourites
userRouter.post("/favourites", addSongInUserFavourites);
userRouter.delete("/favourites", deleteSongInUserFavourites);
userRouter.get("/:userId/favourites", getUserFavourites);

// Listen history
userRouter.get("/:userId/history", getUserHistory);

// Search history
userRouter.get("/:userId/search-history", getUserSearchHistory);
userRouter.post("/search-history", saveUserSearchHistory);
userRouter.delete("/:userId/search-history", clearUserSearchHistory);
