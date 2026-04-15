import { type Request, type Response, type NextFunction } from "express";
import { playlistService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination, type PaginatedResult, type PaginationParams } from "../types/pagination.type";
import type { CreatePlaylistSchema, PlaylistSchema, PlaylistSongSchema } from "../schema/playlist.schema";
import type { SongSchema } from "../schema/songs.schema";
import { asyncHandler } from "../utils/asyncHandler";


export const createPlaylist = asyncHandler(async (req: Request, res: Response) => {
    const data: CreatePlaylistSchema = req.body;
    const playlist:PlaylistSchema = await playlistService.createPlaylist(data);
    return new ApiResponse<PlaylistSchema>(201, "Playlist created", playlist).send(res);
})


export const deletePlaylist = asyncHandler(async (req: Request, res: Response) => {
    const id: string = req.params.id as string;
    const playlist:PlaylistSchema = await playlistService.deletePlaylist(id);
    return new ApiResponse<PlaylistSchema>(200, "Playlist deleted", playlist).send(res);
})



export const getPlaylistById = asyncHandler(async (req: Request, res: Response) => {
    const id: string = req.params.id as string;
    const playlist: PlaylistSchema = await playlistService.getPlaylistById(id);
    return new ApiResponse<PlaylistSchema>(200, "Playlist fetched", playlist).send(res);
})



export const getPlaylists = asyncHandler(async (req: Request, res: Response) => {
    const params: PaginationParams = parsePagination(req.query);
    const result: PaginatedResult<PlaylistSchema> = await playlistService.getPlaylists(params);
    return new ApiResponse<PaginatedResult<PlaylistSchema>>(200, "Playlists fetched", result).send(res);
})


export const addSongInPlaylist = asyncHandler(async (req: Request, res: Response) => {
    const data: PlaylistSongSchema = req.body;
    const entry:PlaylistSongSchema = await playlistService.addSongToPlaylist(data);
    return new ApiResponse<PlaylistSongSchema>(201, "Song added to playlist", entry).send(res);
})

export const deleteSongInPlaylist = asyncHandler(async (req: Request, res: Response) => {
    const data: PlaylistSongSchema = req.body;
    const entry:PlaylistSongSchema = await playlistService.removeSongFromPlaylist(data);
    return new ApiResponse<PlaylistSongSchema>(200, "Song removed from playlist", entry).send(res);
})



export const getSongsOfPlaylist = asyncHandler(async (req: Request, res: Response) => {
    const id: string = req.params.id as string;
    const params: PaginationParams = parsePagination(req.query);
    const result: PaginatedResult<SongSchema> = await playlistService.getPlaylistSongs(id, params);
    return new ApiResponse<PaginatedResult<SongSchema>>(200, "Songs of playlist fetched", result).send(res);
});