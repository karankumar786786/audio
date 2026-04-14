import { type Request, type Response } from "express";
import { type PlaylistService } from "../services/playlist.service";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination } from "../type/pagination.type";
import { asyncHandler } from "../utils/asyncHandler";
import { logMethods, type Logger } from "../observability";

export class PlaylistController {
    constructor(
        private readonly playlistService: PlaylistService,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    getPlaylistById = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const playlist = await this.playlistService.getPlaylistById(id);
        return res.status(200).json(new ApiResponse(200, "Playlist fetched", playlist));
    });

    getPlaylists = asyncHandler(async (req: Request, res: Response) => {
        const params = parsePagination(req.query);
        const result = await this.playlistService.getPlaylists(params);
        return res.status(200).json(new ApiResponse(200, "Playlists fetched", result));
    });

    getSongsOfPlaylist = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const params = parsePagination(req.query);
        const result = await this.playlistService.getPlaylistSongs(id, params);
        return res.status(200).json(new ApiResponse(200, "Songs of playlist fetched", result));
    });
}
