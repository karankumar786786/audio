import { type Request, type Response, type NextFunction } from "express";
import { signatureService, playlistService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination, type PaginatedResult, type PaginationParams } from "../types/pagination.type";
import type { CreatePlaylistSchema, PlaylistSchema, PlaylistSongSchema } from "../schema/playlist.schema";
import type { SongSchema } from "../schema/songs.schema";

export async function createPlaylist(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
        const data:CreatePlaylistSchema = req.body;
        const playlist:PlaylistSchema = await playlistService.createPlaylist(data);
        return res.status(201).json(new ApiResponse(201, "Playlist created", playlist));
    } catch (error: any) {
        next(error);
    }
}

export async function deletePlaylist(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
        const id:string = req.params.id as string;
        signatureService.verifyId(id,"playlistId");
        const playlist:PlaylistSchema = await playlistService.deletePlaylist(id);
        return res.status(200).json(new ApiResponse(200, "Playlist deleted", playlist));
    } catch (error: any) {
        next(error);
    }
}

export async function getPlaylistById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
        const id:string = req.params.id as string;
        signatureService.verifyId(id);
        const playlist:PlaylistSchema = await playlistService.getPlaylistById(id);
        return res.status(200).json(new ApiResponse(200, "Playlist fetched", playlist));
    } catch (error: any) {
        next(error);
    }
}

export async function getPlaylists(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
        const params:PaginationParams = parsePagination(req.query);
        const result:PaginatedResult<PlaylistSchema> = await playlistService.getPlaylists(params);
        return res.status(200).json(new ApiResponse(200, "Playlists fetched", result));
    } catch (error: any) {
        next(error);
    }
}

export async function addSongInPlaylist(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
        const data:PlaylistSongSchema = req.body;
        signatureService.verifyId(data.playlistId,"playlistId");
        signatureService.verifyId(data.songId,"songId");
        const entry:PlaylistSongSchema = await playlistService.addSongToPlaylist(data);
        return res.status(201).json(new ApiResponse(201, "Song added to playlist", entry));
    } catch (error: any) {
        next(error);
    }
}

export async function deleteSongInPlaylist(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
        const data:PlaylistSongSchema = req.body;
        signatureService.verifyId(data.playlistId,"playlistId");
        signatureService.verifyId(data.songId,"songId");
        const entry:PlaylistSongSchema = await playlistService.removeSongFromPlaylist(data);
        return res.status(200).json(new ApiResponse(200, "Song removed from playlist", entry));
    } catch (error: any) {
        next(error);
    }
}

export async function getSongsOfPlaylist(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
        const id:string = req.params.id as string;
        const params:PaginationParams = parsePagination(req.query);
        const result:PaginatedResult<SongSchema> = await playlistService.getPlaylistSongs(id, params);
        return res.status(200).json(new ApiResponse(200, "Songs of playlist fetched", result));
    } catch (error: any) {
        next(error);
    }
}
