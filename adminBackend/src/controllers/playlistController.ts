import { type Request, type Response, type NextFunction } from "express";
import { signatureService, playlistService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination } from "../types/pagination.type";

export async function createPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const playlist = await playlistService.createPlaylist(req.body);
        return res.status(201).json(new ApiResponse(201, "Playlist created", playlist));
    } catch (error: any) {
        next(error);
    }
}

export async function deletePlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        signatureService.verifyId(id,"playlistId");
        const playlist = await playlistService.deletePlaylist(id);
        return res.status(200).json(new ApiResponse(200, "Playlist deleted", playlist));
    } catch (error: any) {
        next(error);
    }
}

export async function getPlaylistById(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        signatureService.verifyId(id);
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

export async function addSongInPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const { playlistId, songId } = req.body;
        signatureService.verifyId(playlistId)
         signatureService.verifyId(songId);
        const entry = await playlistService.addSongToPlaylist(playlistId, songId);
        return res.status(201).json(new ApiResponse(201, "Song added to playlist", entry));
    } catch (error: any) {
        next(error);
    }
}

export async function deleteSongInPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const { playlistId, songId } = req.body;
        if (!signatureService.verifyId(playlistId) || !signatureService.verifyId(songId)) {
            throw new Error("invalid id found");
        }
        const entry = await playlistService.removeSongFromPlaylist(playlistId, songId);
        return res.status(200).json(new ApiResponse(200, "Song removed from playlist", entry));
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
