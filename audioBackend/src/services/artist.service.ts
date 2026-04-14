import { ArtistRepository } from "../repository/artist.repository";
import type { Database } from "../infra/db";
import type { ArtistSchema } from "../schema/artist.schema";
import type { PaginationParams, PaginatedResult } from "../type/pagination.type";
import { buildPaginatedResult } from "../type/pagination.type";
import { logMethods, type Logger } from "../observability";

export class ArtistService {
    constructor(
        private readonly artistRepository: ArtistRepository,
        private readonly db: Database,
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
        
        const [countResult] = await this.db`SELECT count(*)::int as count FROM songs WHERE artist_name = ${artist.name}`;
        const total = countResult?.count || 0;

        const songs = await this.db`
            SELECT 
                id, title, artist_name AS "artistName", duration,
                song_key AS "songKey", image_key AS "imageKey",
                language, job_id AS "jobId", created_at AS "createdAt"
            FROM songs
            WHERE artist_name = ${artist.name}
            ORDER BY created_at DESC
            LIMIT ${params.limit} OFFSET ${offset}
        `;
        
        return buildPaginatedResult(songs, total, params);
    }
}
