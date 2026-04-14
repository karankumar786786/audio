import { type Request, type Response, type NextFunction } from "express";
import { playlistService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination, type PaginatedResult, type PaginationParams } from "../types/pagination.type";
import type { CreatePlaylistSchema, PlaylistSchema, PlaylistSongSchema } from "../schema/playlist.schema";
import type { SongSchema } from "../schema/songs.schema";
import { asyncHandler } from "../utils/asyncHandler";


export const createPlaylist = asyncHandler(async (req: Request, res: Response) => {
    const data: CreatePlaylistSchema = req.body;
    await playlistService.createPlaylist(data);
    return res.status(201).json(new ApiResponse(201, "Playlist created"));
})


export const deletePlaylist = asyncHandler(async (req: Request, res: Response) => {
    const id: string = req.params.id as string;
    await playlistService.deletePlaylist(id);
    return res.status(200).json(new ApiResponse(200, "Playlist deleted"));
})



export const getPlaylistById = asyncHandler(async (req: Request, res: Response) => {
    const id: string = req.params.id as string;
    const playlist: PlaylistSchema = await playlistService.getPlaylistById(id);
    return res.status(200).json(new ApiResponse(200, "Playlist fetched", playlist));
})



export const getPlaylists = asyncHandler(async (req: Request, res: Response) => {
    const params: PaginationParams = parsePagination(req.query);
    const result: PaginatedResult<PlaylistSchema> = await playlistService.getPlaylists(params);
    return res.status(200).json(new ApiResponse(200, "Playlists fetched", result));
})


export const addSongInPlaylist = asyncHandler(async (req: Request, res: Response) => {
    const data: PlaylistSongSchema = req.body;
    await playlistService.addSongToPlaylist(data);
    return res.status(201).json(new ApiResponse(201, "Song added to playlist"));
})

export const deleteSongInPlaylist = asyncHandler(async (req: Request, res: Response) => {
    const data: PlaylistSongSchema = req.body;
    await playlistService.removeSongFromPlaylist(data);
    return res.status(200).json(new ApiResponse(200, "Song removed from playlist"));
})



export const getSongsOfPlaylist = asyncHandler(async (req: Request, res: Response) => {
    const id: string = req.params.id as string;
    const params: PaginationParams = parsePagination(req.query);
    const result: PaginatedResult<SongSchema> = await playlistService.getPlaylistSongs(id, params);
    return res.status(200).json(new ApiResponse(200, "Songs of playlist fetched", result));
})