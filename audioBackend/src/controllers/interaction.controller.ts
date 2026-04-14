import { type Request, type Response } from "express";
import { type InteractionService } from "../services/interaction.service";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination } from "../type/pagination.type";
import { asyncHandler } from "../utils/asyncHandler";
import { logMethods, type Logger } from "../observability";

export class InteractionController {
    constructor(
        private readonly interactionService: InteractionService,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    recordListen = asyncHandler(async (req: Request, res: Response) => {
        const { userId, songId, part } = req.body;
        const entry = await this.interactionService.recordListen(userId, songId, part);
        return res.status(200).json(new ApiResponse(200, "Listen recorded", entry));
    });

    getTrendingSongs = asyncHandler(async (req: Request, res: Response) => {
        const params = parsePagination(req.query);
        const result = await this.interactionService.getTrendingSongs(params);
        return res.status(200).json(new ApiResponse(200, "Trending songs fetched", result));
    });

    getRecommendations = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.params.userId as string;
        const limit = parseInt(req.query.limit as string) || 10;
        const result = await this.interactionService.getRecommendations(userId, limit);
        return res.status(200).json(new ApiResponse(200, "Recommendations fetched", result));
    });
}
