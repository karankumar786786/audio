import {
    systemPlaylistRepository,
    userPlaylistRepository,
    signatureService,
    searchService,
    recommendationService
} from "../infra";
import type { PaginationParams, PaginatedResult } from "../types/pagination.type";
import { buildPaginatedResult } from "../types/pagination.type";

export class PlaylistService {
    // ── System Playlists ────────────────────────────────────────────────────────

    async createSystemPlaylist(data: any) {
        const id = signatureService.generateSignedId();
        const playlist = await systemPlaylistRepository.create({ id, ...data });

        try {
            await searchService.save({ id, ...data } as any);
        } catch (_) { }

        return playlist;
    }

    async getSystemPlaylists(params: PaginationParams): Promise<PaginatedResult<any>> {
        const offset = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            systemPlaylistRepository.getAll(params.limit, offset),
            systemPlaylistRepository.count()
        ]);
        return buildPaginatedResult(data, total, params);
    }

    async getSystemPlaylistById(id: string) {
        return await systemPlaylistRepository.getById(id);
    }

    async getSystemPlaylistSongs(playlistId: string, params: PaginationParams): Promise<PaginatedResult<any>> {
        const offset = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            systemPlaylistRepository.getSongs(playlistId, params.limit, offset),
            systemPlaylistRepository.countSongs(playlistId)
        ]);
        return buildPaginatedResult(data, total, params);
    }

    async deleteSystemPlaylist(id: string) {
        const playlist = await systemPlaylistRepository.delete(id);
        try { await searchService.delete(id); } catch (_) { }
        return playlist;
    }

    async addSongToSystemPlaylist(playlistId: string, songId: string) {
        return await systemPlaylistRepository.addSong(playlistId, songId);
    }

    async removeSongFromSystemPlaylist(playlistId: string, songId: string) {
        return await systemPlaylistRepository.removeSong(playlistId, songId);
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
