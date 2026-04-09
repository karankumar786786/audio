import { type Request, type Response, type NextFunction } from "express";
import { randomUUIDv7 } from "bun";
import {
    userFavouriteSongRepository,
    userHistoryRepository,
    userSearchHistoryRepository,
    recommendationService,
    logger,
} from "../infra";
import { ApiResponse } from "../utils/ApiResponse";

// add song to user favourites
export async function addSongInUserFavourites(req: Request, res: Response, next: NextFunction) {
    try {
        const { userId, songId } = req.body;
        const id = randomUUIDv7();
        const entry = await userFavouriteSongRepository.create({ id, userId, songId });

        // Sync with Recombee
        try { await recommendationService.addFavorite(userId, songId); } catch (_) {}

        return res.status(201).json(new ApiResponse(201, "Song added to favourites", entry));
    } catch (error: any) {
        next(error);
    }
}

// remove song from user favourites
export async function deleteSongInUserFavourites(req: Request, res: Response, next: NextFunction) {
    try {
        const { userId, songId } = req.body;
        const entry = await userFavouriteSongRepository.remove(userId, songId);

        // Sync with Recombee
        try { await recommendationService.removeFavorite(userId, songId); } catch (_) {}

        return res.status(200).json(new ApiResponse(200, "Song removed from favourites", entry));
    } catch (error: any) {
        next(error);
    }
}

// get user favourites
export async function getUserFavourites(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.params.userId as string;
        const favourites = await userFavouriteSongRepository.getByUserId(userId);
        return res.status(200).json(new ApiResponse(200, "User favourites fetched", favourites));
    } catch (error: any) {
        next(error);
    }
}

// get user listen history
export async function getUserHistory(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.params.userId as string;
        const history = await userHistoryRepository.getByUserId(userId);
        return res.status(200).json(new ApiResponse(200, "User history fetched", history));
    } catch (error: any) {
        next(error);
    }
}

// get user search history
export async function getUserSearchHistory(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.params.userId as string;
        const history = await userSearchHistoryRepository.getByUserId(userId);
        return res.status(200).json(new ApiResponse(200, "User search history fetched", history));
    } catch (error: any) {
        next(error);
    }
}

// save user search history
export async function saveUserSearchHistory(req: Request, res: Response, next: NextFunction) {
    try {
        const { userId, searchedText } = req.body;
        const id = randomUUIDv7();
        const entry = await userSearchHistoryRepository.create({ id, userId, searchedText });
        return res.status(201).json(new ApiResponse(201, "Search history saved", entry));
    } catch (error: any) {
        next(error);
    }
}

// clear user search history
export async function clearUserSearchHistory(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.params.userId as string;
        await userSearchHistoryRepository.clearUserHistory(userId);
        return res.status(200).json(new ApiResponse(200, "Search history cleared"));
    } catch (error: any) {
        next(error);
    }
}