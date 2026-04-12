import { type Request, type Response, type NextFunction } from "express";
import { playlistService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { parsePagination } from "../type/pagination.type";
import { systemPlaylistSchema, systemPlaylistSongSchema } from "../schema/systemPlaylist.schema";
import { z } from "zod";

// Validation schema for create (id, createdAt, updatedAt are server-generated)
const createSystemPlaylistInput = systemPlaylistSchema
    .omit({ id: true, createdAt: true, updatedAt: true })
    .extend({
        name: z.string({ error: "name is required" }).min(1, { message: "name cannot be empty" }),
        coverImageKey: z.string({ error: "coverImageKey is required" }).min(1, { message: "coverImageKey cannot be empty" }),
        bannerImageKey: z.string({ error: "bannerImageKey is required" }).min(1, { message: "bannerImageKey cannot be empty" }),
    });

export async function createSystemPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const parsed = createSystemPlaylistInput.safeParse(req.body);
        if (!parsed.success) {
            return next(new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid input"));
        }
        const playlist = await playlistService.createSystemPlaylist(parsed.data);
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
        const playlist = await playlistService.getSystemPlaylistById(id); // Using getById for verification if needed, or service should have update
        // Note: PlaylistService doesn't have update yet, I should add it or use repo directly via service
        // For now using repo method if available or adding to service. I'll stick to service.
        next(new Error("Update not implemented in service layer yet"));
    } catch (error: any) {
        next(error);
    }
}

export async function addSongInSystemPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const parsed = systemPlaylistSongSchema
            .omit({ id: true })
            .safeParse(req.body);
        if (!parsed.success) {
            return next(new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid input"));
        }
        const { playlistId, songId } = parsed.data;
        const entry = await playlistService.addSongToSystemPlaylist(playlistId, songId);
        return res.status(201).json(new ApiResponse(201, "Song added to system playlist", entry));
    } catch (error: any) {
        next(error);
    }
}

export async function deleteSongInSystemPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
        const parsed = systemPlaylistSongSchema
            .omit({ id: true })
            .safeParse(req.body);
        if (!parsed.success) {
            return next(new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid input"));
        };
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
