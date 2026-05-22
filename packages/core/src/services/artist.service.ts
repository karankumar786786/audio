import type { ArtistRepository } from "../repository/artist.repository.ts";
import type { SongRepository } from "../repository/song.repository.ts";
import type { SignatureService } from "../infra/signature.types.ts";
import type { SearchEngineService, SearchRecord } from "../infra/search.types.ts";
import type { ArtistSchema, CreateArtistSchema } from "../schema/artist.schema.ts";
import type { SongSchema } from "../schema/songs.schema.ts";
import { type PaginationParams, type PaginatedResult, buildPaginatedResult } from "../types/pagination.ts";
import { logMethods, type Logger } from "../utils/index.ts";
import { CacheService } from "../infra/cache.service.ts";
import * as path from "node:path";

export class ArtistService {
    constructor(
        private readonly artistRepository: ArtistRepository,
        private readonly songRepository: SongRepository,
        private readonly signatureService: SignatureService,
        private readonly logger: Logger,
        private readonly searchService?: SearchEngineService<SearchRecord>,
        private readonly imageKitClient?: any,
        private readonly cacheService?: CacheService,
    ) {
        logMethods(this, this.logger);
    }

    async getArtists(params: PaginationParams): Promise<PaginatedResult<ArtistSchema>> {
        this.logger.debug({ params }, "getArtists starting");
        const cacheKey = `artists:list:page:${params.page}:limit:${params.limit}`;
        if (this.cacheService) {
            const cached = await this.cacheService.get<PaginatedResult<ArtistSchema>>(cacheKey);
            if (cached) {
                this.logger.debug("getArtists cache hit");
                return cached;
            }
        }

        const offset: number = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            this.artistRepository.getAll(params.limit, offset),
            this.artistRepository.count()
        ]);
        this.logger.debug({ total }, "getArtists successfully fetched");
        const result = buildPaginatedResult<ArtistSchema>(data, total, params);

        if (this.cacheService) {
            await this.cacheService.set(cacheKey, result, 300); // Cache lists for 5 minutes
        }

        return result;
    }

    async getArtistById(id: string): Promise<ArtistSchema> {
        this.logger.debug({ id }, "getArtistById starting");
        this.signatureService.verifyId(id, "artistId");
        const cacheKey = `artists:id:${id}`;
        if (this.cacheService) {
            const cached = await this.cacheService.get<ArtistSchema>(cacheKey);
            if (cached) {
                this.logger.debug({ id }, "getArtistById cache hit");
                return cached;
            }
        }

        const artist = await this.artistRepository.getById(id);

        if (this.cacheService && artist) {
            await this.cacheService.set(cacheKey, artist, 3600); // Cache details for 1 hour
        }

        return artist;
    }

    async getArtistSongs(artistId: string, params: PaginationParams): Promise<PaginatedResult<SongSchema>> {
        this.logger.debug({ artistId, params }, "getArtistSongs starting");
        this.signatureService.verifyId(artistId, "artistId");
        
        const cacheKey = `artists:songs:id:${artistId}:page:${params.page}:limit:${params.limit}`;
        if (this.cacheService) {
            const cached = await this.cacheService.get<PaginatedResult<SongSchema>>(cacheKey);
            if (cached) {
                this.logger.debug({ artistId }, "getArtistSongs cache hit");
                return cached;
            }
        }

        const artist = await this.artistRepository.getById(artistId);
        const offset: number = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            this.songRepository.getArtistSongs(artist.name, params.limit, offset),
            this.songRepository.countByArtistName(artist.name)
        ]);
        this.logger.debug({ artistId, total }, "getArtistSongs successfully fetched");
        const result = buildPaginatedResult<SongSchema>(data, total, params);

        if (this.cacheService) {
            await this.cacheService.set(cacheKey, result, 600); // Cache tracklist for 10 minutes
        }

        return result;
    }

    // ── Admin operations (only available if optional deps are injected) ─────────

    async createArtist(input: CreateArtistSchema): Promise<ArtistSchema> {
        this.logger.debug({ input }, "createArtist starting");
        const id = this.signatureService.generateSignedId();
        const artist = await this.artistRepository.create({ id, ...input });
        this.logger.info({ id }, "artist created in repository");
        
        if (this.cacheService) {
            await this.cacheService.delByPattern("artists:list:*");
            this.logger.debug("artist list cache invalidated");
        }

        if (this.searchService) {
            try {
                await this.searchService.save(artist as SearchRecord);
                this.logger.debug({ id }, "artist saved in search index");
            } catch (err) {
                this.logger.error({ err, id }, "failed to save artist in search index");
            }
        }
        return artist;
    }

    async updateArtist(id: string, data: Partial<ArtistSchema>): Promise<ArtistSchema> {
        this.logger.debug({ id, data }, "updateArtist starting");
        this.signatureService.verifyId(id, "artistId");
        const artist = await this.artistRepository.update(id, data);
        this.logger.info({ id }, "artist updated in repository");
        
        if (this.cacheService) {
            await this.cacheService.del(`artists:id:${id}`);
            await this.cacheService.delByPattern(`artists:songs:id:${id}:*`);
            await this.cacheService.delByPattern("artists:list:*");
            this.logger.debug({ id }, "artist details, songs, and lists cache invalidated");
        }

        if (this.searchService) {
            try {
                await this.searchService.save(artist as SearchRecord);
                this.logger.debug({ id }, "artist updated in search index");
            } catch (err) {
                this.logger.error({ err, id }, "failed to update artist in search index");
            }
        }
        return artist;
    }

    async deleteArtist(id: string): Promise<ArtistSchema> {
        this.logger.debug({ id }, "deleteArtist starting");
        this.signatureService.verifyId(id, "artistId");
        const artist = await this.artistRepository.delete(id);
        this.logger.info({ id }, "artist deleted from repository");

        if (this.cacheService) {
            await this.cacheService.del(`artists:id:${id}`);
            await this.cacheService.delByPattern(`artists:songs:id:${id}:*`);
            await this.cacheService.delByPattern("artists:list:*");
            this.logger.debug({ id }, "artist details, songs, and lists cache invalidated");
        }

        if (this.searchService) {
            try {
                await this.searchService.delete(id);
                this.logger.info({ id }, "artist deleted from search index");
            } catch (err) {
                this.logger.error({ err, id }, "failed to delete artist from search index");
            }
        }

        if (artist.coverImageKey && this.imageKitClient) {
            this.deleteImageFromIK(artist.coverImageKey);
        }
        if (artist.bannerImageKey && this.imageKitClient) {
            this.deleteImageFromIK(artist.bannerImageKey);
        }

        return artist;
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
