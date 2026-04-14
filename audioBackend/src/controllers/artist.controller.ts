import { type Request, type Response } from "express";
import { ArtistService } from "../services/artist.service";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination } from "../type/pagination.type";
import { asyncHandler } from "../utils/asyncHandler";
import { logMethods, type Logger } from "../observability";

export class ArtistController {
    constructor(
        private readonly artistService: ArtistService,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    getArtists = asyncHandler(async (req: Request, res: Response) => {
        const params = parsePagination(req.query);
        const result = await this.artistService.getArtists(params);
        return new ApiResponse(200, "Artists fetched", result).send(res);
    });

    getArtistById = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const artist = await this.artistService.getArtistById(id);
        return new ApiResponse(200, "Artist fetched", artist).send(res);
    });

    getSongsOfArtist = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const params = parsePagination(req.query);
        const result = await this.artistService.getArtistSongs(id, params);
        return new ApiResponse(200, "Songs of artist fetched", result).send(res);
    });
}
