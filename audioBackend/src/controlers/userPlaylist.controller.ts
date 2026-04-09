import { type Request, type Response, type NextFunction } from "express";
import { randomUUIDv7 } from "bun";
import {
    userPlaylistRepository,
    recommendationService,
} from "../infra";
import { ApiResponse } from "../utils/ApiResponse";

// create user playlist
export async function createUserPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const { name, userId } = req.body;
        const id = randomUUIDv7();
        const playlist = await userPlaylistRepository.create({ id, name, userId });
        return res.status(201).json(new ApiResponse(201, "User playlist created", playlist));
    } catch (error: any) {
        next(error);
    }
}

// delete user playlist
export async function deleteUserPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const playlist = await userPlaylistRepository.delete(id);
        return res.status(200).json(new ApiResponse(200, "User playlist deleted", playlist));
    } catch (error: any) {
        next(error);
    }
}

// add song to user playlist
export async function addSongInUserPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const { playlistId, songId, userId } = req.body;
        const entry = await userPlaylistRepository.addSong(playlistId, songId);

        // Sync with Recombee
        try { await recommendationService.addToPlaylist(userId, songId); } catch (_) {}

        return res.status(201).json(new ApiResponse(201, "Song added to playlist", entry));
    } catch (error: any) {
        next(error);
    }
}

// remove song from user playlist
export async function deleteSongInUserPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const { playlistId, songId, userId } = req.body;
        const entry = await userPlaylistRepository.removeSong(playlistId, songId);

        // Sync with Recombee
        try { await recommendationService.removeFromPlaylist(userId, songId); } catch (_) {}

        return res.status(200).json(new ApiResponse(200, "Song removed from playlist", entry));
    } catch (error: any) {
        next(error);
    }
}

// get user playlists
export async function getUserPlaylists(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.params.userId as string;
        const playlists = await userPlaylistRepository.getByUserId(userId);
        return res.status(200).json(new ApiResponse(200, "User playlists fetched", playlists));
    } catch (error: any) {
        next(error);
    }
}

// get songs of a user playlist
export async function getUserPlaylistSongs(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const songs = await userPlaylistRepository.getSongs(id);
        return res.status(200).json(new ApiResponse(200, "Playlist songs fetched", songs));
    } catch (error: any) {
        next(error);
    }
}