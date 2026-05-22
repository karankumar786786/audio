import type { PlaylistRepository } from "../repository/playlist.repository.ts";
import type { SignatureService } from "../infra/signature.types.ts";
import type { SearchEngineService, SearchRecord } from "../infra/search.types.ts";
import type { PlaylistSchema, PlaylistSongSchema, CreatePlaylistSchema } from "../schema/playlist.schema.ts";
import type { SongSchema } from "../schema/songs.schema.ts";
import { type PaginationParams, type PaginatedResult, buildPaginatedResult } from "../types/pagination.ts";
import { logMethods, type Logger } from "../utils/index.ts";
import { CacheService } from "../infra/cache.service.ts";
import * as path from "node:path";

export class PlaylistService {
    constructor(
        private readonly playlistRepository: PlaylistRepository,
        private readonly signatureService: SignatureService,
        private readonly logger: Logger,
        private readonly searchService?: SearchEngineService<SearchRecord>,
        private readonly imageKitClient?: any,
        private readonly cacheService?: CacheService,
    ) {
        logMethods(this, this.logger);
    }

    async getPlaylists(params: PaginationParams): Promise<PaginatedResult<PlaylistSchema>> {
        this.logger.debug({ params }, "getPlaylists starting");
        const cacheKey = `playlists:list:page:${params.page}:limit:${params.limit}`;
        if (this.cacheService) {
            const cached = await this.cacheService.get<PaginatedResult<PlaylistSchema>>(cacheKey);
            if (cached) {
                this.logger.debug("getPlaylists cache hit");
                return cached;
            }
        }

        const offset = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            this.playlistRepository.getAll(params.limit, offset),
            this.playlistRepository.count()
        ]);
        this.logger.debug({ total }, "getPlaylists successfully fetched");
        const result = buildPaginatedResult<PlaylistSchema>(data, total, params);

        if (this.cacheService) {
            await this.cacheService.set(cacheKey, result, 300); // Cache lists for 5 minutes
        }

        return result;
    }

    async getPlaylistById(id: string): Promise<PlaylistSchema> {
        this.logger.debug({ id }, "getPlaylistById starting");
        this.signatureService.verifyId(id, "playlistId");
        const cacheKey = `playlists:id:${id}`;
        if (this.cacheService) {
            const cached = await this.cacheService.get<PlaylistSchema>(cacheKey);
            if (cached) {
                this.logger.debug({ id }, "getPlaylistById cache hit");
                return cached;
            }
        }

        const playlist = await this.playlistRepository.getById(id);

        if (this.cacheService && playlist) {
            await this.cacheService.set(cacheKey, playlist, 3600); // Cache details for 1 hour
        }

        return playlist;
    }

    async getPlaylistSongs(playlistId: string, params: PaginationParams): Promise<PaginatedResult<SongSchema>> {
        this.logger.debug({ playlistId, params }, "getPlaylistSongs starting");
        this.signatureService.verifyId(playlistId, "playlistId");
        const cacheKey = `playlists:songs:id:${playlistId}:page:${params.page}:limit:${params.limit}`;
        if (this.cacheService) {
            const cached = await this.cacheService.get<PaginatedResult<SongSchema>>(cacheKey);
            if (cached) {
                this.logger.debug({ playlistId }, "getPlaylistSongs cache hit");
                return cached;
            }
        }

        const offset = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            this.playlistRepository.getSongs(playlistId, params.limit, offset),
            this.playlistRepository.countSongs(playlistId)
        ]);
        this.logger.debug({ playlistId, total }, "getPlaylistSongs successfully fetched");
        const result = buildPaginatedResult<SongSchema>(data, total, params);

        if (this.cacheService) {
            await this.cacheService.set(cacheKey, result, 600); // Cache tracklist for 10 minutes
        }

        return result;
    }

    async addSongToPlaylist(data: PlaylistSongSchema): Promise<PlaylistSongSchema> {
        this.logger.debug({ data }, "addSongToPlaylist starting");
        this.signatureService.verifyId(data.playlistId, "playlistId");
        this.signatureService.verifyId(data.songId, "songId");
        const result = await this.playlistRepository.addSong(data);
        this.logger.info({ playlistId: data.playlistId, songId: data.songId }, "song added to playlist");

        if (this.cacheService) {
            await this.cacheService.del(`playlists:id:${data.playlistId}`);
            await this.cacheService.delByPattern(`playlists:songs:id:${data.playlistId}:*`);
            this.logger.debug({ playlistId: data.playlistId }, "playlist cache and tracklist invalidated");
        }

        return result;
    }

    async removeSongFromPlaylist(data: PlaylistSongSchema): Promise<PlaylistSongSchema> {
        this.logger.debug({ data }, "removeSongFromPlaylist starting");
        this.signatureService.verifyId(data.playlistId, "playlistId");
        this.signatureService.verifyId(data.songId, "songId");
        const result = await this.playlistRepository.removeSong(data);
        this.logger.info({ playlistId: data.playlistId, songId: data.songId }, "song removed from playlist");

        if (this.cacheService) {
            await this.cacheService.del(`playlists:id:${data.playlistId}`);
            await this.cacheService.delByPattern(`playlists:songs:id:${data.playlistId}:*`);
            this.logger.debug({ playlistId: data.playlistId }, "playlist cache and tracklist invalidated");
        }

        return result;
    }

    // ── Admin operations ────────────────────────────────────────────────────────

    async createPlaylist(data: CreatePlaylistSchema): Promise<PlaylistSchema> {
        this.logger.debug({ data }, "createPlaylist starting");
        const id: string = this.signatureService.generateSignedId();
        const playlist: PlaylistSchema = await this.playlistRepository.create({ id, ...data });
        this.logger.info({ id }, "playlist created in repository");
        
        if (this.cacheService) {
            await this.cacheService.delByPattern("playlists:list:*");
            this.logger.debug("playlist catalogues cache invalidated");
        }

        if (this.searchService) {
            try {
                await this.searchService.save({ id, ...data } as SearchRecord);
                this.logger.debug({ id }, "playlist saved in search service");
            } catch (_) {
                this.logger.error({ id }, "error in saving search service");
            }
        }
        return playlist;
    }

    async deletePlaylist(id: string): Promise<PlaylistSchema> {
        this.logger.debug({ id }, "deletePlaylist starting");
        this.signatureService.verifyId(id, "playlistId");
        const playlist = await this.playlistRepository.delete(id);
        this.logger.info({ id }, "playlist deleted from repository");

        if (this.cacheService) {
            await this.cacheService.del(`playlists:id:${id}`);
            await this.cacheService.delByPattern(`playlists:songs:id:${id}:*`);
            await this.cacheService.delByPattern("playlists:list:*");
            this.logger.debug({ id }, "playlist details, tracklists, and catalogues cache invalidated");
        }

        if (this.searchService) {
            try {
                await this.searchService.delete(id);
                this.logger.info({ id }, "playlist deleted from search index");
            } catch (err) {
                this.logger.error({ err, id }, "failed to delete playlist from search service");
            }
        }

        if (playlist.coverImageKey && this.imageKitClient) {
            this.deleteImageFromIK(playlist.coverImageKey);
        }
        if (playlist.bannerImageKey && this.imageKitClient) {
            this.deleteImageFromIK(playlist.bannerImageKey);
        }

        return playlist;
    }

    private async deleteImageFromIK(filePath: string): Promise<void> {
        if (!this.imageKitClient) return;
        try {
            const result = await this.imageKitClient.listFiles({
                path: path.dirname(filePath),
                name: path.basename(filePath),
            });

            if (result && result.length > 0) {
                const file = result[0] as any;
                if (file.fileId) {
                    await this.imageKitClient.deleteFile(file.fileId);
                    this.logger.info({ filePath, fileId: file.fileId }, "image deleted from ImageKit");
                }
            }
        } catch (error) {
            this.logger.error({ error, filePath }, "failed to cleanup image from ImageKit");
        }
    }
}
