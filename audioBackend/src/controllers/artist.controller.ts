import { type Request, type Response } from "express";
import { ArtistService } from "../services/artist.service";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination, type PaginatedResult, type PaginationParams } from "../type/pagination.type";
import { asyncHandler } from "../utils/asyncHandler";
import { logMethods, type Logger } from "../observability";
import type { ArtistSchema, SongSchema } from "../schema";

export class ArtistController {
    constructor(
        private readonly artistService: ArtistService,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    getArtists = asyncHandler(async (req: Request, res: Response) => {
        const params:PaginationParams = parsePagination(req.query);
        const result:PaginatedResult<ArtistSchema> = await this.artistService.getArtists(params);
        return new ApiResponse(200, "Artists fetched", result).send(res);
    });

    getArtistById = asyncHandler(async (req: Request, res: Response) => {
        const id:string = req.params.id as string;
        const artist:ArtistSchema = await this.artistService.getArtistById(id);
        return new ApiResponse(200, "Artist fetched", artist).send(res);
    });

    getSongsOfArtist = asyncHandler(async (req: Request, res: Response) => {
        const id:string = req.params.id as string;
        const params:PaginationParams = parsePagination(req.query);
        const result:PaginatedResult<SongSchema> = await this.artistService.getArtistSongs(id, params);
        return new ApiResponse(200, "Songs of artist fetched", result).send(res);
    });
}
