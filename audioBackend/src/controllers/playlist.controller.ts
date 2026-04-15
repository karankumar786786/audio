import { type Request, type Response } from "express";
import { type PlaylistService } from "../services/playlist.service";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination, type PaginatedResult, type PaginationParams } from "../type/pagination.type";
import { asyncHandler } from "../utils/asyncHandler";
import { logMethods, type Logger } from "../observability";
import type { PlaylistSchema, SongSchema } from "../schema";

export class PlaylistController {
    constructor(
        private readonly playlistService: PlaylistService,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    getPlaylistById = asyncHandler(async (req: Request, res: Response) => {
        const id:string = req.params.id as string;
        const playlist:PlaylistSchema = await this.playlistService.getPlaylistById(id);
        return new ApiResponse(200, "Playlist fetched", playlist).send(res);
    });

    getPlaylists = asyncHandler(async (req: Request, res: Response) => {
        const params:PaginationParams = parsePagination(req.query);
        const result:PaginatedResult<PlaylistSchema> = await this.playlistService.getPlaylists(params);
        return new ApiResponse(200, "Playlists fetched", result).send(res);
    });

    getSongsOfPlaylist = asyncHandler(async (req: Request, res: Response) => {
        const id:string = req.params.id as string;
        const params:PaginationParams = parsePagination(req.query);
        const result:PaginatedResult<SongSchema> = await this.playlistService.getPlaylistSongs(id, params);
        return new ApiResponse(200, "Songs of playlist fetched", result).send(res);
    });
}
