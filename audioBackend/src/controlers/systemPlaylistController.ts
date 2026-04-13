import { type Request, type Response, type NextFunction } from "express";
import { playlistService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination } from "../type/pagination.type";

export async function getSystemPlaylistById(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const playlist = await playlistService.getSystemPlaylistById(id);
        return res.status(200).json(new ApiResponse(200, "System playlist fetched", playlist));
    } catch (error: any) {
        next(error);
    }
}

export async function getSystemPlaylists(req: Request, res: Response, next: NextFunction) {
    try {
        const params = parsePagination(req.query);
        const result = await playlistService.getSystemPlaylists(params);
        return res.status(200).json(new ApiResponse(200, "System playlists fetched", result));
    } catch (error: any) {
        next(error);
    }
}

export async function getSongsOfSystemPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const params = parsePagination(req.query);
        const result = await playlistService.getSystemPlaylistSongs(id, params);
        return res.status(200).json(new ApiResponse(200, "Songs of system playlist fetched", result));
    } catch (error: any) {
        next(error);
    }
}
