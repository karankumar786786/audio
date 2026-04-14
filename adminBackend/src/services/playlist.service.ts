import {
    playlistRepository,
    signatureService,
    searchService,
} from "../infra";
import type { PlaylistSchema, PlaylistSongSchema, CreatePlaylistSchema } from "../schema/playlist.schema";
import type { SongSchema } from "../schema/songs.schema";
import type { PaginationParams, PaginatedResult } from "../types/pagination.type";
import { buildPaginatedResult } from "../types/pagination.type";

export class PlaylistService {

    async createPlaylist(data: CreatePlaylistSchema): Promise<PlaylistSchema> {
        const id:string = signatureService.generateSignedId();
        const playlist:PlaylistSchema = await playlistRepository.create({ id, ...data });
        try {
            await searchService.save({ id, ...data } as any);
        } catch (_) { }

        return playlist;
    }
    async getPlaylists(params: PaginationParams): Promise<PaginatedResult<PlaylistSchema>> {
        const offset:number = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            playlistRepository.getAll(params.limit, offset),
            playlistRepository.count()
        ]);
        return buildPaginatedResult<PlaylistSchema>(data, total, params);
    }
    async getPlaylistById(id: string): Promise<PlaylistSchema> {
        return await playlistRepository.getById(id);
    }
    async getPlaylistSongs(playlistId: string, params: PaginationParams): Promise<PaginatedResult<SongSchema>> {
        const offset = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            playlistRepository.getSongs(playlistId, params.limit, offset),
            playlistRepository.countSongs(playlistId)
        ]);
        return buildPaginatedResult<SongSchema>(data, total, params);
    }
    async deletePlaylist(id: string): Promise<PlaylistSchema> {
        const playlist = await playlistRepository.delete(id);
        try { await searchService.delete(id); } catch (_) { }
        return playlist;
    }
    async addSongToPlaylist(data:PlaylistSongSchema): Promise<PlaylistSongSchema> {
        return await playlistRepository.addSong(data);
    }
    async removeSongFromPlaylist(data:PlaylistSongSchema): Promise<PlaylistSongSchema> {
        return await playlistRepository.removeSong(data);
    }
}

