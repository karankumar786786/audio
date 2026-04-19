import type { Database } from "../infra/db";
import { songSchema, type SongSchema } from "../schema/songs.schema";
import { BaseRepository } from "./base.repository";
import { logMethods, type Logger } from "../observability";
import { type SignatureService } from "../lib";

type CreateSongData = Omit<SongSchema, "createdAt">;
type partial = Partial<CreateSongData>;
type UpdateSongData = Omit<partial, "songKey" | 'language' | 'jobId' | 'duration'>;

export class SongRepository extends BaseRepository<SongSchema, CreateSongData, UpdateSongData> {
    constructor(
        db: Database,
        logger: Logger,
        private readonly signatureService: SignatureService
    ) {
        super(db, "songs", songSchema, logger);
        logMethods(this, this.logger);
    }

    async create(data: CreateSongData): Promise<SongSchema> {
        const id = this.signatureService.generateSignedId();
        const [song] = await this.db`
            INSERT INTO songs (id, title, artist_name, duration, song_key, image_key, language, job_id)
            VALUES (
                ${id}, ${data.title}, ${data.artistName}, ${data.duration},
                ${data.songKey}, ${data.imageKey}, ${data.language}, ${data.jobId}
            )
            RETURNING 
                id, title, artist_name AS "artistName", duration, 
                song_key AS "songKey", image_key AS "imageKey", 
                language, job_id AS "jobId", created_at AS "createdAt"
        `;
        if (!song) throw new Error("Failed to create song");
        return this.mapRow(song);
    }

    async update(id: string, data: UpdateSongData): Promise<SongSchema> {
        this.signatureService.verifyId(id, "songId");
        const [song] = await this.db`
            UPDATE songs
            SET
                title       = COALESCE(${data.title ?? null}, title),
                artist_name = COALESCE(${data.artistName ?? null}, artist_name),
                image_key   = COALESCE(${data.imageKey ?? null}, image_key)
            WHERE id = ${id}
            RETURNING 
                id, title, artist_name AS "artistName", duration, 
                song_key AS "songKey", image_key AS "imageKey", 
                language, job_id AS "jobId", created_at AS "createdAt"
        `;
        if (!song) throw new Error(`Song with id ${id} not found`);
        return this.mapRow(song);
    }

    async getAll(limit?: number, offset?: number): Promise<SongSchema[]> {
        const rows = await this.db`
            SELECT 
                id, title, artist_name AS "artistName", duration, 
                song_key AS "songKey", image_key AS "imageKey", 
                language, job_id AS "jobId", created_at AS "createdAt"
            FROM songs 
            ORDER BY created_at DESC
            LIMIT ${limit ?? null} OFFSET ${offset ?? null}
        `;
        return rows.map((row) => this.mapRow(row));
    }

    override async count(): Promise<number> {
        const [row] = await this.db`SELECT count(*)::int as count FROM songs`;
        return row?.count || 0;
    }

    async getByArtistName(name: string, limit: number, offset: number): Promise<SongSchema[]> {
        // Normalize: Strip all non-alphanumeric characters for fuzzy match
        const normalizedName = `%${name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}%`;
        const rows = await this.db`
            SELECT 
                id, title, artist_name AS "artistName", duration, 
                song_key AS "songKey", image_key AS "imageKey", 
                language, job_id AS "jobId", created_at AS "createdAt"
            FROM songs
            WHERE regexp_replace(COALESCE(artist_name, ''), '[^a-zA-Z0-9]', '', 'g') ILIKE ${normalizedName}
            ORDER BY created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `;
        return rows.map((row) => this.mapRow(row));
    }

    async countByArtistName(name: string): Promise<number> {
        const normalizedName = `%${name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}%`;
        const [row] = await this.db`
            SELECT count(*)::int as count 
            FROM songs 
            WHERE regexp_replace(COALESCE(artist_name, ''), '[^a-zA-Z0-9]', '', 'g') ILIKE ${normalizedName}
        `;
        return row?.count || 0;
    }

    async getByIds(ids: string[]): Promise<SongSchema[]> {
        if (ids.length === 0) return [];
        // Optional: verify each ID in songs service instead of here for batches
        const rows = await this.db`
            SELECT 
                id, title, artist_name AS "artistName", duration, 
                song_key AS "songKey", image_key AS "imageKey", 
                language, job_id AS "jobId", created_at AS "createdAt"
            FROM songs 
            WHERE id IN (${ids})
        `;
        return rows.map((row) => this.mapRow(row));
    }

    async getByBaseIds(baseIds: string[]): Promise<SongSchema[]> {
        if (baseIds.length === 0) return [];
        const rows = await this.db`
            SELECT 
                id, title, artist_name AS "artistName", duration, 
                song_key AS "songKey", image_key AS "imageKey", 
                language, job_id AS "jobId", created_at AS "createdAt"
            FROM songs 
            WHERE split_part(id, '.', 1) = ANY(${baseIds})
        `;
        return rows.map((row) => this.mapRow(row));
    }
}