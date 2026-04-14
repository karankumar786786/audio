import { type Request, type Response, type NextFunction } from "express";
import { playlistService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination } from "../type/pagination.type";

export async function getPlaylistById(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const playlist = await playlistService.getPlaylistById(id);
        return res.status(200).json(new ApiResponse(200, "Playlist fetched", playlist));
    } catch (error: any) {
        next(error);
    }
}

export async function getPlaylists(req: Request, res: Response, next: NextFunction) {
    try {
        const params = parsePagination(req.query);
        const result = await playlistService.getPlaylists(params);
        return res.status(200).json(new ApiResponse(200, "Playlists fetched", result));
    } catch (error: any) {
        next(error);
    }
}

export async function getSongsOfPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const params = parsePagination(req.query);
        const result = await playlistService.getPlaylistSongs(id, params);
        return res.status(200).json(new ApiResponse(200, "Songs of playlist fetched", result));
    } catch (error: any) {
        next(error);
    }
}

