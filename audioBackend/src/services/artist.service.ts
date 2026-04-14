import { type ArtistRepository } from "../repository/artist.repository";
import { type SongRepository } from "../repository/song.repository";
import type { ArtistSchema } from "../schema/artist.schema";
import type { PaginationParams, PaginatedResult } from "../type/pagination.type";
import { buildPaginatedResult } from "../type/pagination.type";
import { logMethods, type Logger } from "../observability";

export class ArtistService {
    constructor(
        private readonly artistRepository: ArtistRepository,
        private readonly songRepository: SongRepository,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }
    async getArtists(params: PaginationParams): Promise<PaginatedResult<ArtistSchema>> {
        const offset = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            this.artistRepository.getAll(params.limit, offset),
            this.artistRepository.count()
        ]);
        
        return buildPaginatedResult(data, total, params);
    }
    async getArtistById(id: string): Promise<ArtistSchema> {
        return await this.artistRepository.getById(id);
    }
    async getArtistSongs(artistId: string, params: PaginationParams): Promise<PaginatedResult<any>> {
        const artist = await this.artistRepository.getById(artistId);
        const offset = (params.page - 1) * params.limit;
        
        const [total, songs] = await Promise.all([
            this.songRepository.countByArtistName(artist.name),
            this.songRepository.getByArtistName(artist.name, params.limit, offset)
        ]);
        return buildPaginatedResult(songs, total, params);
    }
}
