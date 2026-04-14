import { Router } from "express";
import { userController } from "../infra";
import { validate } from "../middlewares/validate.middleware";
import { createUserSchema } from "../schema/user.schema";
import { userFavouriteSongSchema } from "../schema/userFavouriteSong.schema";
import { userSearchHistorySchema } from "../schema/userSearchHistory.schema";

const favouriteSongInput = userFavouriteSongSchema.pick({ userId: true, songId: true });
const searchHistoryInput = userSearchHistorySchema.pick({ userId: true, searchedText: true });

export const userRouter = Router();

// Create / upsert user (for testing & Auth0 post-login callback)
userRouter.post("/", validate(createUserSchema), userController.createUser);
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
