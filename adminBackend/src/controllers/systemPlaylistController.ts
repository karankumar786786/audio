import { type Request, type Response, type NextFunction } from "express";
import { playlistService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination } from "../types/pagination.type";

export async function createSystemPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const playlist = await playlistService.createSystemPlaylist(req.body);
        return res.status(201).json(new ApiResponse(201, "System playlist created", playlist));
    } catch (error: any) {
        next(error);
    }
}

export async function deleteSystemPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const playlist = await playlistService.deleteSystemPlaylist(id);
        return res.status(200).json(new ApiResponse(200, "System playlist deleted", playlist));
    } catch (error: any) {
        next(error);
    }
}

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

export async function updateSystemPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        // Note: PlaylistService doesn't have update yet.
        next(new Error("Update not implemented in service layer yet"));
    } catch (error: any) {
        next(error);
    }
}

export async function addSongInSystemPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const { playlistId, songId } = req.body;
        const entry = await playlistService.addSongToSystemPlaylist(playlistId, songId);
        return res.status(201).json(new ApiResponse(201, "Song added to system playlist", entry));
    } catch (error: any) {
        next(error);
    }
}

export async function deleteSongInSystemPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const { playlistId, songId } = req.body;
        const entry = await playlistService.removeSongFromSystemPlaylist(playlistId, songId);
        return res.status(200).json(new ApiResponse(200, "Song removed from system playlist", entry));
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
