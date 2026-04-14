import type { SearchService } from "../lib/search";
import type { SignatureService } from "../lib/signature";
import type { Logger } from "../observablity";
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

    ) {}
    async createArtist(data: CreateArtistSchema): Promise<ArtistSchema> {
        const id: string = this.signatureService.generateSignedId();
        const artist: ArtistSchema = await this.artistRepository.create({ id, ...data });

        // Index in Algolia for search
        try {
            await this.searchService.save({
                id,
                name: data.name,
                about: data.about,
                dob: data.dob,
                coverImageKey: data.coverImageKey,
                bannerImageKey: data.bannerImageKey
            } as any);
        } catch (_) {
            this.logger.info("saving in searchService failed");
         }

        return artist;
    }

    async getArtists(params: PaginationParams): Promise<PaginatedResult<ArtistSchema>> {
        const offset: number = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            this.artistRepository.getAll(params.limit, offset),
            this.artistRepository.count()
        ]);
        return buildPaginatedResult<ArtistSchema>(data, total, params);
    }

    async getArtistById(id: string): Promise<ArtistSchema> {
        this.signatureService.verifyId(id);
        return await this.artistRepository.getById(id);
    }

    async updateArtist(id: string, data: UpdateArtistSchema): Promise<ArtistSchema> {
        this.signatureService.verifyId(id);
        return await this.artistRepository.update(id, data);
    }

    async deleteArtist(id: string): Promise<ArtistSchema> {
        this.signatureService.verifyId(id);
        const artist: ArtistSchema = await this.artistRepository.delete(id);
        try { await this.searchService.delete(id); } catch (_) { 
            this.logger.error("error from deleting search service");
        }
        return artist;
    }

    async getArtistSongs(id: string, params: PaginationParams): Promise<PaginatedResult<SongSchema>> {
        this.signatureService.verifyId(id);
        const artist: ArtistSchema = await this.artistRepository.getById(id);
        const offset: number = (params.page - 1) * params.limit;
        const [songs, total] = await Promise.all([
            this.songRepository.getByArtistName(artist.name, params.limit, offset),
            this.songRepository.countByArtistName(artist.name)
        ]);
        return buildPaginatedResult<SongSchema>(songs, total, params);
    }
}
