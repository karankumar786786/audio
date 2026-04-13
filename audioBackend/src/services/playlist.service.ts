import {
    playlistRepository,
    userPlaylistRepository,
    signatureService,
    searchService,
    recommendationService
} from "../infra";
import type { PaginationParams, PaginatedResult } from "../type/pagination.type";
import { buildPaginatedResult } from "../type/pagination.type";

export class PlaylistService {
    // ── Playlists ───────────────────────────────────────────────────────────────

    async createPlaylist(data: any) {
        const id = signatureService.generateSignedId();
        const playlist = await playlistRepository.create({ id, ...data });

        try {
            await searchService.save({ id, ...data } as any);
        } catch (_) { }

        return playlist;
    }

    async getPlaylists(params: PaginationParams): Promise<PaginatedResult<any>> {
        const offset = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            playlistRepository.getAll(params.limit, offset),
            playlistRepository.count()
        ]);
        return buildPaginatedResult(data, total, params);
    }

    async getPlaylistById(id: string) {
        return await playlistRepository.getById(id);
    }

    async getPlaylistSongs(playlistId: string, params: PaginationParams): Promise<PaginatedResult<any>> {
        const offset = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            playlistRepository.getSongs(playlistId, params.limit, offset),
            playlistRepository.countSongs(playlistId)
        ]);
        return buildPaginatedResult(data, total, params);
    }

    async deletePlaylist(id: string) {
        const playlist = await playlistRepository.delete(id);
        try { await searchService.delete(id); } catch (_) { }
        return playlist;
    }

    async addSongToPlaylist(playlistId: string, songId: string) {
        return await playlistRepository.addSong(playlistId, songId);
    }

    async removeSongFromPlaylist(playlistId: string, songId: string) {
        return await playlistRepository.removeSong(playlistId, songId);
    }


    // ── User Playlists ──────────────────────────────────────────────────────────

    async createUserPlaylist(data: any) {
        return await userPlaylistRepository.create(data);
    }

    async getUserPlaylists(userId: string, params: PaginationParams): Promise<PaginatedResult<any>> {
        const offset = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            userPlaylistRepository.getByUserId(userId, params.limit, offset),
            userPlaylistRepository.countByUserId(userId)
        ]);
        return buildPaginatedResult(data, total, params);
    }

    async getUserPlaylistSongs(playlistId: string, params: PaginationParams): Promise<PaginatedResult<any>> {
        const offset = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            userPlaylistRepository.getSongs(playlistId, params.limit, offset),
            userPlaylistRepository.countSongs(playlistId)
        ]);
        return buildPaginatedResult(data, total, params);
    }

    async addSongToUserPlaylist(playlistId: string, songId: string, userId: string) {
        const entry = await userPlaylistRepository.addSong(playlistId, songId);
        try { await recommendationService.addToPlaylist(userId, songId); } catch (_) { }
        return entry;
    }

    async removeSongFromUserPlaylist(playlistId: string, songId: string, userId: string) {
        const entry = await userPlaylistRepository.removeSong(playlistId, songId);
        try { await recommendationService.removeFromPlaylist(userId, songId); } catch (_) { }
        return entry;
    }

    async deleteUserPlaylist(id: string) {
        return await userPlaylistRepository.delete(id);
    }
}
