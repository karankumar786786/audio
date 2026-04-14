import type { Database } from "../infra/db";
import type { SongSchema } from "../schema/songs.schema";
import type { Repository } from "../type/repository.type";
import { logMethods, type Logger } from "../observability";

type CreateSongData = Omit<SongSchema, "createdAt">;
type partial = Partial<CreateSongData>;
type UpdateSongData = Omit<partial,"songKey" | 'language' | 'jobId' | 'duration'>;

export class SongRepository implements Repository<SongSchema, CreateSongData, UpdateSongData> {
    constructor(
        private readonly db: Database,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    async create(data: CreateSongData): Promise<SongSchema> {
        const [song] = await this.db`
            INSERT INTO songs (id, title, artist_name, duration, song_key, image_key, language, job_id)
            VALUES (
                ${data.id},
                ${data.title},
                ${data.artistName},
                ${data.duration},
                ${data.songKey},
                ${data.imageKey},
                ${data.language},
                ${data.jobId}
            )
            RETURNING *
        `;
        if (!song) throw new Error("Failed to create song");
        return this.mapRow(song);
    }

    async getById(id: string): Promise<SongSchema> {
        const [song] = await this.db`
            SELECT * FROM songs WHERE id = ${id}
        `;
        if (!song) throw new Error(`Song with id ${id} not found`);
        return this.mapRow(song);
    }

    async count(): Promise<number> {
        const [row] = await this.db`SELECT count(*)::int as count FROM songs`;
        return row?.count || 0;
    }

    async getAll(limit?: number, offset?: number): Promise<SongSchema[]> {
        const songs = await this.db`
            SELECT * FROM songs 
            ORDER BY created_at DESC
            LIMIT ${limit ?? null} OFFSET ${offset ?? null}
        `;
        return songs.map((row) => this.mapRow(row));
    }

    async update(id: string, data: UpdateSongData): Promise<SongSchema> {
        const [song] = await this.db`
            UPDATE songs
            SET
                title       = COALESCE(${data.title ?? null}, title),
                artist_name = COALESCE(${data.artistName ?? null}, artist_name),
                image_key   = COALESCE(${data.imageKey ?? null}, image_key)
            WHERE id = ${id}
            RETURNING *
        `;
        if (!song) throw new Error(`Song with id ${id} not found`);
        return this.mapRow(song);
    }

    async delete(id: string): Promise<SongSchema> {
        const [song] = await this.db`
            DELETE FROM songs WHERE id = ${id} RETURNING *
        `;
        
        if (!song) throw new Error(`Song with id ${id} not found`);
        return this.mapRow(song);
    }

    async getByArtistName(name: string, limit: number, offset: number): Promise<SongSchema[]> {
        const songs = await this.db`
            SELECT 
                id, title, artist_name, duration,
                song_key, image_key,
                language, job_id, created_at
            FROM songs
            WHERE artist_name = ${name}
            ORDER BY created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `;
        return songs.map((row) => this.mapRow(row));
    }

    async countByArtistName(name: string): Promise<number> {
        const [row] = await this.db`
            SELECT count(*)::int as count FROM songs WHERE artist_name = ${name}
        `;
        return row?.count || 0;
    }

    // Maps DB snake_case row → camelCase SongSchema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapRow(row: Record<string, any>): SongSchema {
        return {
            id: row.id as string,
            title: row.title as string,
            artistName: row.artist_name as string,
            duration: row.duration as number,
            songKey: row.song_key as string,
            imageKey: row.image_key as string,
            language: row.language as string,
            jobId: row.job_id as string,
            createdAt: (row.created_at as Date)?.toISOString(),
        };
    }
}