import { type Request, type Response, type NextFunction } from "express";
import {
    systemPlaylistRepository,
    signatureService,
    searchService,
} from "../infra";
import { ApiResponse } from "../utils/ApiResponse";

// create system playlist
export async function createSystemPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const { name, coverImageKey, bannerImageKey } = req.body;
        const id = signatureService.generateSignedId();
        const playlist = await systemPlaylistRepository.create({ id, name, coverImageKey, bannerImageKey });
        // Index in Algolia for search
        try {
            await searchService.save({ id, name, coverImageKey, bannerImageKey } as any);
        } catch (_) {}
        return res.status(201).json(new ApiResponse(201, "System playlist created", playlist));
    } catch (error: any) {
        next(error);
    }
}

// delete system playlist
export async function deleteSystemPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const playlist = await systemPlaylistRepository.delete(id);

        try { await searchService.delete(id); } catch (_) {}

        return res.status(200).json(new ApiResponse(200, "System playlist deleted", playlist));
    } catch (error: any) {
        next(error);
    }
}

// add song to system playlist
export async function addSongInSystemPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const { playlistId, songId } = req.body;
        const entry = await systemPlaylistRepository.addSong(playlistId, songId);
        return res.status(201).json(new ApiResponse(201, "Song added to system playlist", entry));
    } catch (error: any) {
        next(error);
    }
}

// remove song from system playlist
export async function deleteSongInSystemPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const { playlistId, songId } = req.body;
        const entry = await systemPlaylistRepository.removeSong(playlistId, songId);
        return res.status(200).json(new ApiResponse(200, "Song removed from system playlist", entry));
    } catch (error: any) {
        next(error);
    }
}

// get all system playlists
export async function getSystemPlaylists(_req: Request, res: Response, next: NextFunction) {
    try {
        const playlists = await systemPlaylistRepository.getAll();
        return res.status(200).json(new ApiResponse(200, "System playlists fetched", playlists));
    } catch (error: any) {
        next(error);
    }
}

// get single system playlist by id
export async function getSystemPlaylistById(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const playlist = await systemPlaylistRepository.getById(id);
        return res.status(200).json(new ApiResponse(200, "System playlist fetched", playlist));
    } catch (error: any) {
        next(error);
    }
}

// get songs of a system playlist
export async function getSongsOfSystemPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const songs = await systemPlaylistRepository.getSongs(id);
        return res.status(200).json(new ApiResponse(200, "Playlist songs fetched", songs));
    } catch (error: any) {
        next(error);
    }
}
