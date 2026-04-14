import type { Database } from "../infra/db";
import { artistSchema, type ArtistSchema } from "../schema/artist.schema";
import { BaseRepository } from "./base.repository";
import { logMethods, type Logger } from "../observablity";

type CreateArtistData = Omit<ArtistSchema, "createdAt">;
type UpdateArtistData = Partial<CreateArtistData>;

export class ArtistRepository extends BaseRepository<ArtistSchema, CreateArtistData, UpdateArtistData> {
    constructor(
        db: Database,
        logger: Logger
    ) {
        super(db, "artists", artistSchema, logger);
        logMethods(this, this.logger);
    }

    async create(data: CreateArtistData): Promise<ArtistSchema> {
        const [artist] = await this.db`
            INSERT INTO artists (id, name, about, dob, cover_image_key, banner_image_key)
            VALUES (
                ${data.id}, ${data.name}, ${data.about}, ${data.dob}, 
                ${data.coverImageKey}, ${data.bannerImageKey}
            )
            RETURNING 
                id, name, about, dob, 
                cover_image_key AS "coverImageKey", 
                banner_image_key AS "bannerImageKey", 
                created_at AS "createdAt"
        `;
        if (!artist) throw new Error("Failed to create artist");
        return this.mapRow(artist);
    }

    async update(id: string, data: UpdateArtistData): Promise<ArtistSchema> {
        const [artist] = await this.db`
            UPDATE artists
            SET
                name             = COALESCE(${data.name ?? null}, name),
                about            = COALESCE(${data.about ?? null}, about),
                dob              = COALESCE(${data.dob ?? null}, dob),
                cover_image_key  = COALESCE(${data.coverImageKey ?? null}, cover_image_key),
                banner_image_key = COALESCE(${data.bannerImageKey ?? null}, banner_image_key)
            WHERE id = ${id}
            RETURNING 
                id, name, about, dob, 
                cover_image_key AS "coverImageKey", 
                banner_image_key AS "bannerImageKey", 
                created_at AS "createdAt"
        `;
        if (!artist) throw new Error(`Artist with id ${id} not found`);
        return this.mapRow(artist);
    }

    async getAll(limit?: number, offset?: number): Promise<ArtistSchema[]> {
        const rows = await this.db`
            SELECT 
                id, name, about, dob, 
                cover_image_key AS "coverImageKey", 
                banner_image_key AS "bannerImageKey", 
                created_at AS "createdAt"
            FROM artists 
            ORDER BY created_at DESC
            LIMIT ${limit ?? null} OFFSET ${offset ?? null}
        `;
        return rows.map((row) => this.mapRow(row));
    }

    async getSongs(artistName: string, limit: number, offset: number): Promise<any[]> {
        // Note: For admin, we return raw rows or map to SongSchema if needed. 
        // Reusing the SQL from SongRepository.
        const rows = await this.db`
            SELECT 
                id, title, artist_name AS "artistName", duration, 
                song_key AS "songKey", image_key AS "imageKey", 
                language, job_id AS "jobId"
            FROM songs
            WHERE artist_name = ${artistName}
            LIMIT ${limit} OFFSET ${offset}
        `;
        return rows;
    }

    async countSongs(artistName: string): Promise<number> {
        const [row] = await this.db`
            SELECT count(*)::int as count FROM songs WHERE artist_name = ${artistName}
        `;
        return row?.count || 0;
    }
}
