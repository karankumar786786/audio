import type { SearchService } from "../lib/search";
import type { SignatureService } from "../lib/signature";
import type { PlaylistRepository } from "../repository";
import type { PlaylistSchema, PlaylistSongSchema, CreatePlaylistSchema } from "../schema/playlist.schema";
import type { SongSchema } from "../schema/songs.schema";
import type { PaginationParams, PaginatedResult } from "../types/pagination.type";
import { buildPaginatedResult } from "../types/pagination.type";

export class PlaylistService {

    constructor(
        private readonly playlistRepository:PlaylistRepository,
        private readonly signatureService:SignatureService,
        private readonly searchService:SearchService,
    ) {

    }

    async createPlaylist(data: CreatePlaylistSchema): Promise<PlaylistSchema> {
        const id:string = this.signatureService.generateSignedId();
        const playlist:PlaylistSchema = await this.playlistRepository.create({ id, ...data });
        try {
            await this.searchService.save({ id, ...data } as any);
        } catch (_) { }

        return playlist;
    }
    async getPlaylists(params: PaginationParams): Promise<PaginatedResult<PlaylistSchema>> {
        const offset:number = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            this.playlistRepository.getAll(params.limit, offset),
            this.playlistRepository.count()
        ]);
        return buildPaginatedResult<PlaylistSchema>(data, total, params);
    }
    async getPlaylistById(id: string): Promise<PlaylistSchema> {
        return await this.playlistRepository.getById(id);
    }
    async getPlaylistSongs(playlistId: string, params: PaginationParams): Promise<PaginatedResult<SongSchema>> {
        const offset = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            this.playlistRepository.getSongs(playlistId, params.limit, offset),
            this.playlistRepository.countSongs(playlistId)
        ]);
        return buildPaginatedResult<SongSchema>(data, total, params);
    }
    async deletePlaylist(id: string): Promise<PlaylistSchema> {
        const playlist = await this.playlistRepository.delete(id);
        try { await this.searchService.delete(id); } catch (_) { }
        return playlist;
    }
    async addSongToPlaylist(data:PlaylistSongSchema): Promise<PlaylistSongSchema> {
        return await this.playlistRepository.addSong(data);
    }
    async removeSongFromPlaylist(data:PlaylistSongSchema): Promise<PlaylistSongSchema> {
        return await this.playlistRepository.removeSong(data);
    }
}

