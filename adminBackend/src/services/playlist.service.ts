import type { SearchService } from "../lib/search";
import type { SignatureService } from "../lib/signature";
import { logMethods, type Logger } from "../observablity";
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
        private readonly logger:Logger,
    ) {
        logMethods(this, this.logger);
    }

    async createPlaylist(data: CreatePlaylistSchema): Promise<PlaylistSchema> {
        this.logger.debug({ data }, "createPlaylist starting");
        const id:string = this.signatureService.generateSignedId();
        const playlist:PlaylistSchema = await this.playlistRepository.create({ id, ...data });
        this.logger.info({ id }, "playlist created in repository");
        try {
            await this.searchService.save({ id, ...data } as any);
            this.logger.debug({ id }, "playlist saved in search service");
        } catch (_) {
            this.logger.error({ id }, "error in saving search service");
        }
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
        this.signatureService.verifyId(id,"playlistId");
        return await this.playlistRepository.getById(id);
    }
    async getPlaylistSongs(playlistId: string, params: PaginationParams): Promise<PaginatedResult<SongSchema>> {
        const offset:number = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            this.playlistRepository.getSongs(playlistId, params.limit, offset),
            this.playlistRepository.countSongs(playlistId)
        ]);
        return buildPaginatedResult<SongSchema>(data, total, params);
    }
    async deletePlaylist(id: string): Promise<PlaylistSchema> {
        this.signatureService.verifyId(id,"playlistId");
        const playlist = await this.playlistRepository.delete(id);
        try { await this.searchService.delete(id); } catch (_) { 
            this.logger.error("error in deleting from search service");
        }
        return playlist;
    }
    async addSongToPlaylist(data:PlaylistSongSchema): Promise<PlaylistSongSchema> {
        this.logger.debug({ data }, "addSongToPlaylist starting");
        this.signatureService.verifyId(data.playlistId,"playlistId");
        this.signatureService.verifyId(data.songId,"songId");
        const result = await this.playlistRepository.addSong(data);
        this.logger.info({ playlistId: data.playlistId, songId: data.songId }, "song added to playlist");
        return result;
    }
    async removeSongFromPlaylist(data:PlaylistSongSchema): Promise<PlaylistSongSchema> {
        this.signatureService.verifyId(data.playlistId,"playlistId");
        this.signatureService.verifyId(data.songId,"songId");
        return await this.playlistRepository.removeSong(data);
    }
}
