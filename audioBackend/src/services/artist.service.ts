import { 
    artistRepository, 
    db
} from "../infra";
import type { ArtistSchema } from "../schema/artist.schema";
import type { PaginationParams, PaginatedResult } from "../type/pagination.type";
import { buildPaginatedResult } from "../type/pagination.type";

export class ArtistService {
    async getArtists(params: PaginationParams): Promise<PaginatedResult<ArtistSchema>> {
        const offset = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            artistRepository.getAll(params.limit, offset),
            artistRepository.count()
        ]);
        
        return buildPaginatedResult(data, total, params);
    }

    async getArtistById(id: string): Promise<ArtistSchema> {
        return await artistRepository.getById(id);
    }

    async getArtistSongs(artistId: string, params: PaginationParams): Promise<PaginatedResult<any>> {
        const artist = await artistRepository.getById(artistId);
        const offset = (params.page - 1) * params.limit;
        
        const [countResult] = await db`SELECT count(*)::int as count FROM songs WHERE artist_name = ${artist.name}`;
        const total = countResult?.count || 0;

        const songs = await db`
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
