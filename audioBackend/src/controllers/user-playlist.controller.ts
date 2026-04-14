import { type Request, type Response } from "express";
import { type UserPlaylistRepository } from "../repository/user-playlist.repository";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination } from "../type/pagination.type";
import { asyncHandler } from "../utils/asyncHandler";
import { logMethods, type Logger } from "../observability";
import { userPlaylistSchema } from "../schema/userPlaylist.schema";

export class UserPlaylistController {
    constructor(
        private readonly userPlaylistRepository: UserPlaylistRepository,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    createPlaylist = asyncHandler(async (req: Request, res: Response) => {
        const validatedData = userPlaylistSchema.parse(req.body);
        const playlist = await this.userPlaylistRepository.create(validatedData);
        return res.status(201).json(new ApiResponse(201, "User playlist created", playlist));
    });

    getPlaylistById = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const playlist = await this.userPlaylistRepository.getById(id);
        return res.status(200).json(new ApiResponse(200, "User playlist fetched", playlist));
    });

    getUserPlaylists = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.params.userId as string;
        const params = parsePagination(req.query);
        const offset = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            this.userPlaylistRepository.getByUserId(userId, params.limit, offset),
            this.userPlaylistRepository.countByUserId(userId)
        ]);
        return res.status(200).json(new ApiResponse(200, "User playlists fetched", { data, total, ...params }));
    });

    addSongToPlaylist = asyncHandler(async (req: Request, res: Response) => {
        const { playlistId, songId } = req.body;
        const entry = await this.userPlaylistRepository.addSong(playlistId, songId);
        return res.status(200).json(new ApiResponse(200, "Song added to playlist", entry));
    });

    removeSongFromPlaylist = asyncHandler(async (req: Request, res: Response) => {
        const { playlistId, songId } = req.body;
        const entry = await this.userPlaylistRepository.removeSong(playlistId, songId);
        return res.status(200).json(new ApiResponse(200, "Song removed from playlist", entry));
    });

    getPlaylistSongs = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const params = parsePagination(req.query);
        const offset = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            this.userPlaylistRepository.getSongs(id, params.limit, offset),
            this.userPlaylistRepository.countSongs(id)
        ]);
        return res.status(200).json(new ApiResponse(200, "Songs of user playlist fetched", { data, total, ...params }));
    });

    deletePlaylist = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const playlist = await this.userPlaylistRepository.delete(id);
        return res.status(200).json(new ApiResponse(200, "User playlist deleted", playlist));
    });
}