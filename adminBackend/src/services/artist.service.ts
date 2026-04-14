import type { SearchRecord, SearchService } from "../lib/search";
import type { SignatureService } from "../lib/signature";
import { logMethods, type Logger } from "../observablity";
import type { ArtistRepository, SongRepository } from "../repository";
import type { ArtistSchema, CreateArtistSchema } from "../schema/artist.schema";
import type { SongSchema } from "../schema/songs.schema";
import type { PaginatedResult, PaginationParams } from "../types/pagination.type";
import { buildPaginatedResult } from "../types/pagination.type";

export class ArtistService {

    constructor(
        private readonly artistRepository: ArtistRepository,
        private readonly songRepository: SongRepository,
        private readonly signatureService: SignatureService,
        private readonly searchService: SearchService,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    async createArtist(input: CreateArtistSchema): Promise<ArtistSchema> {
        this.logger.debug({ input }, "createArtist starting");
        const id = this.signatureService.generateSignedId();
        const artist = await this.artistRepository.create({ id, ...input });
        this.logger.info({ id }, "artist created in repository");
        try {
            await this.searchService.save(artist as SearchRecord);
            this.logger.debug({ id }, "artist saved in search index");
        } catch (err) {
            this.logger.error({ err, id }, "failed to save artist in search index");
        }
        return artist;
    }

    async getArtists(params: PaginationParams): Promise<PaginatedResult<ArtistSchema>> {
        this.logger.debug({ params }, "getArtists starting");
        const offset: number = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            this.artistRepository.getAll(params.limit, offset),
            this.artistRepository.count()
        ]);
        this.logger.debug({ total }, "getArtists successfully fetched");
        return buildPaginatedResult<ArtistSchema>(data, total, params);
    }

    async getArtistById(id: string): Promise<ArtistSchema> {
        this.logger.debug({ id }, "getArtistById starting");
        this.signatureService.verifyId(id, "artistId");
        // Repository now auto-throws NotFoundError
        return await this.artistRepository.getById(id);
    }

    async updateArtist(id: string, data: Partial<ArtistSchema>): Promise<ArtistSchema> {
        this.logger.debug({ id, data }, "updateArtist starting");
        this.signatureService.verifyId(id, "artistId");
        const artist = await this.artistRepository.update(id, data);
        this.logger.info({ id }, "artist updated in repository");
        try {
            await this.searchService.save(artist as SearchRecord);
            this.logger.debug({ id }, "artist updated in search index");
        } catch (err) {
            this.logger.error({ err, id }, "failed to update artist in search index");
        }
        return artist;
    }

    async deleteArtist(id: string): Promise<ArtistSchema> {
        this.logger.debug({ id }, "deleteArtist starting");
        this.signatureService.verifyId(id, "artistId");
        const artist = await this.artistRepository.delete(id);
        this.logger.info({ id }, "artist deleted from repository");
        try {
            await this.searchService.delete(id);
            this.logger.info({ id }, "artist deleted from search index");
        } catch (err) {
            this.logger.error({ err, id }, "failed to delete artist from search index");
        }
        return artist;
    }

    async getArtistSongs(artistId: string, params: PaginationParams): Promise<PaginatedResult<SongSchema>> {
        this.logger.debug({ artistId, params }, "getArtistSongs starting");
        this.signatureService.verifyId(artistId, "artistId");
        
        const artist = await this.artistRepository.getById(artistId);
        
        const offset: number = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            this.songRepository.getArtistSongs(artist.name, params.limit, offset),
            this.songRepository.countByArtistName(artist.name)
        ]);
        
        this.logger.debug({ artistId, total }, "getArtistSongs successfully fetched");
        return buildPaginatedResult<SongSchema>(data as SongSchema[], total, params);
    }
}
