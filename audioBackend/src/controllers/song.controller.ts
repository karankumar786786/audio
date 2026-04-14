import { type Request, type Response } from "express";
import { type SongService } from "../services/song.service";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination } from "../type/pagination.type";
import { asyncHandler } from "../utils/asyncHandler";
import { logMethods, type Logger } from "../observability";

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
        const params = parsePagination(req.query);
        const result = await this.songService.getSongs(params);
        return res.status(200).json(new ApiResponse(200, "Songs fetched successfully", result));
    });

    getSongById = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const song = await this.songService.getSongById(id);
        return res.status(200).json(new ApiResponse(200, "Song fetched successfully", song));
    });
}
