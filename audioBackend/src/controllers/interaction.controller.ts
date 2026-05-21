import { type Request, type Response } from "express";
import { type InteractionService, type SongSchema, type PaginatedResult, type PaginationParams, parsePagination } from "@onemelody/core";
import { ApiResponse } from "../utils/ApiResponse";
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
        const userId = (req as any).user.id;
        const { songId, part } = req.body;
        this.logger.info(`[InteractionController] Recording listen: user=${userId}, song=${songId}, part=${part}%`);
        await this.interactionService.recordListen(userId, songId, part);
        return new ApiResponse<null>(200, "Listen recorded").send(res);
    });

    getTrendingSongs = asyncHandler(async (req: Request, res: Response) => {
        const params: PaginationParams = parsePagination(req.query);
        const result: PaginatedResult<SongSchema> = await this.interactionService.getTrendingSongs(params);
        return new ApiResponse<PaginatedResult<SongSchema>>(200, "Trending songs fetched", result).send(res);
    });

    getRecommendations = asyncHandler(async (req: Request, res: Response) => {
        const userId: string = (req as any).user.id;
        const limit: number = parseInt(req.query.limit as string) || 10;
        const result: PaginatedResult<SongSchema> = await this.interactionService.getRecommendations(userId, limit);
        return new ApiResponse<PaginatedResult<SongSchema>>(200, "Recommendations fetched", result).send(res);
    });
}
