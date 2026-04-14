import type { Database } from "../infra/db";
import { songSchema, type SongSchema } from "../schema/songs.schema";
import { BaseRepository } from "./base.repository";
import { logMethods, type Logger } from "../observablity";

type CreateSongData = Omit<SongSchema, "createdAt">;
type partial = Partial<CreateSongData>;
type UpdateSongData = Omit<partial, "songKey" | 'language' | 'jobId' | 'duration'>;

export class SongRepository extends BaseRepository<SongSchema, CreateSongData, UpdateSongData> {
    constructor(
        db: Database,
        logger: Logger
    ) {
        super(db, "songs", songSchema, logger);
        logMethods(this, this.logger);
    }

    async create(data: CreateSongData): Promise<SongSchema> {
        const [song] = await this.db`
            INSERT INTO songs (id, title, artist_name, duration, song_key, image_key, language, job_id)
            VALUES (
                ${data.id}, ${data.title}, ${data.artistName}, ${data.duration},
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

    async getArtistSongs(name: string, limit: number, offset: number): Promise<SongSchema[]> {
        const rows = await this.db`
            SELECT 
                id, title, artist_name AS "artistName", duration, 
                song_key AS "songKey", image_key AS "imageKey", 
                language, job_id AS "jobId", created_at AS "createdAt"
            FROM songs
            WHERE artist_name = ${name}
            ORDER BY created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `;
        return rows.map((row) => this.mapRow(row));
    }

    async countByArtistName(name: string): Promise<number> {
        const [row] = await this.db`
            SELECT count(*)::int as count FROM songs WHERE artist_name = ${name}
        `;
        return row?.count || 0;
    }

    async getStats(): Promise<any> {
        const [row] = await this.db`
            SELECT 
                COUNT(*)::int as total_songs,
                SUM(duration)::int as total_duration
            FROM songs
        `;
        return row;
    }
}