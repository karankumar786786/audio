import type { SearchRecord, SearchService } from "../lib/search";
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
            await this.searchService.save({ id, ...data } as SearchRecord);
            this.logger.debug({ id }, "playlist saved in search service");
        } catch (_) {
            this.logger.error({ id }, "error in saving search service");
        }
        return playlist;
    }

    async getPlaylists(params: PaginationParams): Promise<PaginatedResult<PlaylistSchema>> {
        this.logger.debug({ params }, "getPlaylists starting");
        const offset:number = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            this.playlistRepository.getAll(params.limit, offset),
            this.playlistRepository.count()
        ]);
        this.logger.debug({ total }, "getPlaylists successfully fetched");
        return buildPaginatedResult<PlaylistSchema>(data, total, params);
    }

    async getPlaylistById(id: string): Promise<PlaylistSchema> {
        this.logger.debug({ id }, "getPlaylistById starting");
        this.signatureService.verifyId(id,"playlistId");
        return await this.playlistRepository.getById(id);
    }

    async getPlaylistSongs(playlistId: string, params: PaginationParams): Promise<PaginatedResult<SongSchema>> {
        this.logger.debug({ playlistId, params }, "getPlaylistSongs starting");
        this.signatureService.verifyId(playlistId,"playlistId");
        const offset:number = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            this.playlistRepository.getSongs(playlistId, params.limit, offset),
            this.playlistRepository.countSongs(playlistId)
        ]);
        this.logger.debug({ playlistId, total }, "getPlaylistSongs successfully fetched");
        return buildPaginatedResult<SongSchema>(data as SongSchema[], total, params);
    }

    async deletePlaylist(id: string): Promise<PlaylistSchema> {
        this.logger.debug({ id }, "deletePlaylist starting");
        this.signatureService.verifyId(id,"playlistId");
        const playlist = await this.playlistRepository.delete(id);
        this.logger.info({ id }, "playlist deleted from repository");
        try { 
            await this.searchService.delete(id); 
            this.logger.info({ id }, "playlist deleted from search index");
        } catch (err) { 
            this.logger.error({ err, id }, "failed to delete playlist from search service");
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
        this.logger.debug({ data }, "removeSongFromPlaylist starting");
        this.signatureService.verifyId(data.playlistId,"playlistId");
        this.signatureService.verifyId(data.songId,"songId");
        const result = await this.playlistRepository.removeSong(data);
        this.logger.info({ playlistId: data.playlistId, songId: data.songId }, "song removed from playlist");
        return result;
    }
}
