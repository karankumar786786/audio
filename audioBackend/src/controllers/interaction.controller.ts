import { type Request, type Response } from "express";
import { type InteractionService } from "../services/interaction.service";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination, type PaginatedResult, type PaginationParams } from "../type/pagination.type";
import { asyncHandler } from "../utils/asyncHandler";
import { logMethods, type Logger } from "../observability";
import type { SongSchema } from "../schema";

export class InteractionController {
    constructor(
        private readonly interactionService: InteractionService,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    recordListen = asyncHandler(async (req: Request, res: Response) => {
        const { userId, songId, part } = req.body;
        this.logger.info(`[InteractionController] Recording listen: user=${userId}, song=${songId}, part=${part}%`);
        await this.interactionService.recordListen(userId, songId, part);
        return new ApiResponse<null>(200, "Listen recorded").send(res);
    });

    getTrendingSongs = asyncHandler(async (req: Request, res: Response) => {
        const params:PaginationParams = parsePagination(req.query);
        const result:PaginatedResult<SongSchema> = await this.interactionService.getTrendingSongs(params);
        return  new ApiResponse<PaginatedResult<SongSchema>>(200, "Trending songs fetched", result).send(res);
    });

    getRecommendations = asyncHandler(async (req: Request, res: Response) => {
        const userId:string = req.params.userId as string;
        const limit:number = parseInt(req.query.limit as string) || 10;
        const result:PaginatedResult<SongSchema> = await this.interactionService.getRecommendations(userId, limit);
        return new ApiResponse<PaginatedResult<SongSchema>>(200, "Recommendations fetched", result).send(res);
    });
}
