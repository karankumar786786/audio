import { type Request, type Response, type NextFunction } from "express";
import { playlistService, signatureService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination } from "../type/pagination.type";

export async function createUserPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const { name, userId } = req.body;
        const id = signatureService.generateSignedId();
        const playlist = await playlistService.createUserPlaylist({ id, name, userId });
        return res.status(201).json(new ApiResponse(201, "User playlist created", playlist));
    } catch (error: any) {
        next(error);
    }
}

export async function getUserPlaylists(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.params.userId as string;
        const params = parsePagination(req.query);
        const result = await playlistService.getUserPlaylists(userId, params);
        return res.status(200).json(new ApiResponse(200, "User playlists fetched", result));
    } catch (error: any) {
        next(error);
    }
}

export async function deleteUserPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const playlist = await playlistService.deleteUserPlaylist(id);
        return res.status(200).json(new ApiResponse(200, "User playlist deleted", playlist));
    } catch (error: any) {
        next(error);
    }
}

export async function addSongInUserPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const { playlistId, songId, userId } = req.body;
        const entry = await playlistService.addSongToUserPlaylist(playlistId, songId, userId);
        return res.status(201).json(new ApiResponse(201, "Song added to user playlist", entry));
    } catch (error: any) {
        next(error);
    }
}

export async function deleteSongInUserPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const { playlistId, songId, userId } = req.body;
        const entry = await playlistService.removeSongFromUserPlaylist(playlistId, songId, userId);
        return res.status(200).json(new ApiResponse(200, "Song removed from user playlist", entry));
    } catch (error: any) {
        next(error);
    }
}

export async function getUserPlaylistSongs(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const params = parsePagination(req.query);
        const result = await playlistService.getUserPlaylistSongs(id, params);
        return res.status(200).json(new ApiResponse(200, "Songs of user playlist fetched", result));
    } catch (error: any) {
        next(error);
    }
}