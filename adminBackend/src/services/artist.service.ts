import type { SearchRecord, SearchService } from "../lib/search";

import type { SignatureService } from "../lib/signature";
import { logMethods, type Logger } from "../observablity";
import type { ArtistRepository, SongRepository } from "../repository";
import type { ArtistSchema, CreateArtistSchema, UpdateArtistSchema } from "../schema/artist.schema";
import type { SongSchema } from "../schema/songs.schema";
import type { PaginationParams, PaginatedResult } from "../types/pagination.type";
import { buildPaginatedResult } from "../types/pagination.type";

export class ArtistService {
    constructor(
        private readonly artistRepository:ArtistRepository,
        private readonly songRepository:SongRepository,
        private readonly signatureService:SignatureService,
        private readonly searchService:SearchService,
        private readonly logger:Logger,
    ) {
        logMethods(this, this.logger);
    }
    async createArtist(data: CreateArtistSchema): Promise<ArtistSchema> {
        this.logger.debug({ data }, "createArtist starting");
        const id: string = this.signatureService.generateSignedId();
        const artist: ArtistSchema = await this.artistRepository.create({ id, ...data });
        this.logger.info({ id }, "artist created in repository");
        try {
            await this.searchService.save({
                id,
                name: data.name,
                about: data.about,
                dob: data.dob,
                coverImageKey: data.coverImageKey,
                bannerImageKey: data.bannerImageKey
            });
        } catch (_) {
            this.logger.info("saving in searchService failed");
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
        this.signatureService.verifyId(id);
        return await this.artistRepository.getById(id);
    }

    async updateArtist(id: string, data: UpdateArtistSchema): Promise<ArtistSchema> {
        this.logger.debug({ id, data }, "updateArtist starting");
        this.signatureService.verifyId(id);
        const artist = await this.artistRepository.update(id, data);
        this.logger.info({ id }, "artist updated in repository");
        try {
            await this.searchService.save(artist as SearchRecord);
        } catch (err) {
            this.logger.error({ err, id }, "failed to update search index after artist update");
        }
        return artist;
    }

    async deleteArtist(id: string): Promise<ArtistSchema> {
        this.logger.debug({ id }, "deleteArtist starting");
        this.signatureService.verifyId(id);
        const artist: ArtistSchema = await this.artistRepository.delete(id);
        this.logger.info({ id }, "artist deleted from repository");
        try { 
            await this.searchService.delete(id); 
            this.logger.info({ id }, "artist deleted from search index");
        } catch (err) { 
            this.logger.error({ err, id }, "failed to delete artist from search service");
        }
        return artist;
    }

    async getArtistSongs(artistId: string, params: PaginationParams): Promise<PaginatedResult<SongSchema>> {
        this.logger.debug({ artistId, params }, "getArtistSongs starting");
        this.signatureService.verifyId(artistId);
        const artist: ArtistSchema = await this.artistRepository.getById(artistId);
        const offset: number = (params.page - 1) * params.limit;
        const [songs, total] = await Promise.all([
            this.songRepository.getByArtistName(artist.name, params.limit, offset),
            this.songRepository.countByArtistName(artist.name)
        ]);
        this.logger.debug({ artistId, total }, "getArtistSongs successfully fetched");
        return buildPaginatedResult<SongSchema>(songs as SongSchema[], total, params);
    }
}
