import { type Request, type Response } from "express";
import { type SongService } from "../services/song.service";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination, type PaginatedResult, type PaginationParams } from "../type/pagination.type";
import { asyncHandler } from "../utils/asyncHandler";
import { logMethods, type Logger } from "../observability";
import type { SongSchema } from "../schema";

/**
 * Controller for song-related operations.
 * Delegates business logic to SongService.
 */
export class SongController {
    constructor(
        private readonly songService: SongService,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    getSongs = asyncHandler(async (req: Request, res: Response) => {
        const params:PaginationParams = parsePagination(req.query);
        const result:PaginatedResult<SongSchema> = await this.songService.getSongs(params);
        return new ApiResponse<PaginatedResult<SongSchema>>(200, "Songs fetched successfully", result).send(res);
    });

    getSongById = asyncHandler(async (req: Request, res: Response) => {
        const id:string = req.params.id as string;
        const song:SongSchema = await this.songService.getSongById(id);
        return new ApiResponse<SongSchema>(200, "Song fetched successfully", song).send(res);
    });
}
