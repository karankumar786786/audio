import { type Database } from "../infra";
import type { SongSchema } from "../schema/songs.schema";
import type { Repository } from "../types/repository.type";
import { logMethods, type Logger } from "../observablity";
import { NotFoundError } from "../errors";

type CreateSongData = Omit<SongSchema, "createdAt">;
type partial = Partial<CreateSongData>;
type UpdateSongData = Omit<partial, "songKey" | 'language' | 'jobId' | 'duration'>;

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
        if (!song) throw new NotFoundError(`Song with id ${id} not found`);
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
        if (!song) throw new NotFoundError(`Song with id ${id} not found`);
        return this.mapRow(song);
    }

    async countByArtistName(artistName: string): Promise<number> {
        const [row] = await this.db`SELECT count(*)::int as count FROM songs WHERE artist_name = ${artistName}`;
        return row?.count || 0;
    }

    async getByArtistName(artistName: string, limit?: number, offset?: number): Promise<SongSchema[]> {
        const rows = await this.db`
            SELECT * FROM songs 
            WHERE artist_name = ${artistName}
            ORDER BY created_at DESC
            LIMIT ${limit ?? null} OFFSET ${offset ?? null}
        `;
        return rows.map((row) => this.mapRow(row));
    }

    async delete(id: string): Promise<SongSchema> {
        const [song] = await this.db`
            DELETE FROM songs WHERE id = ${id} RETURNING *
        `;

        if (!song) throw new NotFoundError(`Song with id ${id} not found`);
        return this.mapRow(song);
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