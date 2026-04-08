import { db } from "../infra";
import type { SongSchema } from "../schema/songs.schema";
import type { Repository } from "../type/repository.type";
import { randomUUIDv7 } from "bun";

type CreateSongData = Omit<SongSchema, "id" | "createdAt">;
type UpdateSongData = Partial<CreateSongData>;

export class SongRepository implements Repository<SongSchema, CreateSongData, UpdateSongData> {

    async create(data: CreateSongData): Promise<SongSchema> {
        const id = randomUUIDv7();
        const [song] = await db`
            INSERT INTO songs (id, title, artist_name, time_in_ms, song_key, image_key, language)
            VALUES (
                ${id},
                ${data.title},
                ${data.artistName},
                ${data.duration},
                ${data.songKey},
                ${data.imageKey},
                ${data.language}
            )
            RETURNING *
        `;
        if (!song) throw new Error("Failed to create song");
        return this.mapRow(song);
    }

    async getById(id: string): Promise<SongSchema> {
        const [song] = await db`
            SELECT * FROM songs WHERE id = ${id}
        `;
        if (!song) throw new Error(`Song with id ${id} not found`);
        return this.mapRow(song);
    }

    async getAll(): Promise<SongSchema[]> {
        const songs = await db`SELECT * FROM songs ORDER BY created_at DESC`;
        return songs.map((row) => this.mapRow(row));
    }

    async update(id: string, data: UpdateSongData): Promise<SongSchema> {
        const [song] = await db`
            UPDATE songs
            SET
                title       = COALESCE(${data.title ?? null}, title),
                artist_name = COALESCE(${data.artistName ?? null}, artist_name),
                time_in_ms  = COALESCE(${data.duration ?? null}, time_in_ms),
                song_key    = COALESCE(${data.songKey ?? null}, song_key),
                image_key   = COALESCE(${data.imageKey ?? null}, image_key),
                language    = COALESCE(${data.language ?? null}, language)
            WHERE id = ${id}
            RETURNING *
        `;
        if (!song) throw new Error(`Song with id ${id} not found`);
        return this.mapRow(song);
    }

    async delete(id: string): Promise<SongSchema> {
        const [song] = await db`
            DELETE FROM songs WHERE id = ${id} RETURNING *
        `;
        if (!song) throw new Error(`Song with id ${id} not found`);
        return this.mapRow(song);
    }

    // Maps DB snake_case row → camelCase SongSchema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapRow(row: Record<string, any>): SongSchema {
        return {
            id: row.id as string,
            title: row.title as string,
            artistName: row.artist_name as string,
            duration: row.time_in_ms as number,
            songKey: row.song_key as string,
            imageKey: row.image_key as string,
            language: row.language as string,
            createdAt: (row.created_at as Date)?.toISOString(),
        };
    }
}