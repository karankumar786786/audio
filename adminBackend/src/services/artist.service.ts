import {
    artistRepository,
    signatureService,
    searchService,
    db
} from "../infra";
import type { ArtistSchema } from "../schema/artist.schema";
import type { PaginationParams, PaginatedResult } from "../types/pagination.type";
import { buildPaginatedResult } from "../types/pagination.type";

export class ArtistService {
    constructor() {
        
    }
    async createArtist(data: any) {
        const id = signatureService.generateSignedId();
        const artist = await artistRepository.create({ id, ...data });

        // Index in Algolia for search
        try {
            await searchService.save({
                id,
                name: data.name,
                about: data.about,
                dob: data.dob,
                coverImageKey: data.coverImageKey,
                bannerImageKey: data.bannerImageKey
            } as any);
        } catch (_) { }

        return artist;
    }

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

    async updateArtist(id: string, data: any): Promise<ArtistSchema> {
        return await artistRepository.update(id, data);
    }

    async deleteArtist(id: string): Promise<ArtistSchema> {
        const artist = await artistRepository.delete(id);
        try { await searchService.delete(id); } catch (_) { }
        return artist;
    }

    async getArtistSongs(artistId: string, params: PaginationParams): Promise<PaginatedResult<any>> {
        const artist = await artistRepository.getById(artistId);
        const offset = (params.page - 1) * params.limit;

        // Count songs by artist name (since repo doesn't have direct countByArtist)
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
