import { type Request, type Response, type NextFunction } from "express";
import { signatureService, userService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination } from "../type/pagination.type";
import { createUserSchema } from "../schema/user.schema";
import { userFavouriteSongSchema } from "../schema/userFavouriteSong.schema";
import { userSearchHistorySchema } from "../schema/userSearchHistory.schema";
import { ApiError } from "../utils/ApiError";

const favouriteSongInput = userFavouriteSongSchema.pick({ userId: true, songId: true });
const searchHistoryInput = userSearchHistorySchema.pick({ userId: true, searchedText: true });

export async function createUser(req: Request, res: Response, next: NextFunction) {
    try {
        const parsed = createUserSchema.safeParse(req.body);
        if (!parsed.success) {
            return next(new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid input"));
        }
        const { id, email } = parsed.data;
        const user = await userService.createUser(id, email);
        return res.status(201).json(new ApiResponse(201, "User created successfully", user));
    } catch (error: any) {
        next(error);
    }
}


export async function addSongInUserFavourites(req: Request, res: Response, next: NextFunction) {
    try {
        const parsed = favouriteSongInput.safeParse(req.body);
        if (!parsed.success) {
            return next(new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid input"));
        }
        const { userId, songId } = parsed.data;
        const id = signatureService.generateSignedId();
        const entry = await userService.addFavourite(userId, songId, id);
        return res.status(201).json(new ApiResponse(201, "Song added to favourites", entry));
    } catch (error: any) {
        next(error);
    }
}

export async function deleteSongInUserFavourites(req: Request, res: Response, next: NextFunction) {
    try {
        const parsed = favouriteSongInput.safeParse(req.body);
        if (!parsed.success) {
            return next(new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid input"));
        }
        const { userId, songId } = parsed.data;
        const entry = await userService.removeFavourite(userId, songId);
        return res.status(200).json(new ApiResponse(200, "Song removed from favourites", entry));
    } catch (error: any) {
        next(error);
    }
}

export async function getUserFavourites(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.params.userId as string;
        const params = parsePagination(req.query);
        const result = await userService.getFavourites(userId, params);
        return res.status(200).json(new ApiResponse(200, "User favourites fetched", result));
    } catch (error: any) {
        next(error);
    }
}

export async function getUserHistory(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.params.userId as string;
        const params = parsePagination(req.query);
        const result = await userService.getHistory(userId, params);
        return res.status(200).json(new ApiResponse(200, "User history fetched", result));
    } catch (error: any) {
        next(error);
    }
}

export async function getUserSearchHistory(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.params.userId as string;
        const params = parsePagination(req.query);
        const result = await userService.getSearchHistory(userId, params);
        return res.status(200).json(new ApiResponse(200, "User search history fetched", result));
    } catch (error: any) {
        next(error);
    }
}

export async function saveUserSearchHistory(req: Request, res: Response, next: NextFunction) {
    try {
        const parsed = searchHistoryInput.safeParse(req.body);
        if (!parsed.success) {
            return next(new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid input"));
        }
        const { userId, searchedText } = parsed.data;
        const id = signatureService.generateSignedId();
        const entry = await userService.saveSearchHistory(userId, searchedText, id);
        return res.status(201).json(new ApiResponse(201, "Search history saved", entry));
    } catch (error: any) {
        next(error);
    }
}

export async function clearUserSearchHistory(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.params.userId as string;
        await userService.clearSearchHistory(userId);
        return res.status(200).json(new ApiResponse(200, "Search history cleared"));
    } catch (error: any) {
        next(error);
    }
}