import { type Request, type Response, type NextFunction } from "express";
import { interactionService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { parsePagination } from "../type/pagination.type";
import { userHistorySchema } from "../schema/userHistory.schema";

const addListenInput = userHistorySchema.pick({ userId: true, songId: true, part: true });

export async function addListen(req: Request, res: Response, next: NextFunction) {
    try {
        const parsed = addListenInput.safeParse(req.body);
        if (!parsed.success) {
            return next(new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid input"));
        }
        const { userId, songId, part } = parsed.data;
        const entry = await interactionService.recordListen(userId, songId, part);
        return res.status(201).json(new ApiResponse(201, "Listen recorded", entry));
    } catch (error: any) {
        next(error);
    }
}

export async function getTrendingSongs(req: Request, res: Response, next: NextFunction) {
    try {
        const params = parsePagination(req.query);
        const result = await interactionService.getTrendingSongs(params);
        return res.status(200).json(new ApiResponse(200, "Trending songs fetched", result));
    } catch (error: any) {
        next(error);
    }
}

export async function getRecommendedSongs(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.params.userId as string;
        const limit = parseInt(req.query.limit as string) || 20;
        const recommendations = await interactionService.getRecommendations(userId, limit);
        return res.status(200).json(new ApiResponse(200, "Recommendations fetched", recommendations));
    } catch (error: any) {
        next(error);
    }
}
