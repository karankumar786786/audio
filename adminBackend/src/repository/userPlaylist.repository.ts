import { randomUUIDv7 } from "bun";
import { db } from "../infra";
import { type UserPlaylistSchema, type UserPlaylistSongSchema } from "../schema/userPlaylist.schema";
import type { Repository } from "../types/repository.type";


type UpdatePlaylistData = Partial<UserPlaylistSchema>;

export class UserPlaylistRepository implements Repository<UserPlaylistSchema, UserPlaylistSchema, UpdatePlaylistData> {

    async create(data: UserPlaylistSchema): Promise<UserPlaylistSchema> {
        const [playlist] = await db`
            INSERT INTO user_playlists (id, name, user_id)
            VALUES (
                ${data.id},
                ${data.name},
                ${data.userId}
            )
            RETURNING *
        `;
        if (!playlist) throw new Error("Failed to create user playlist");
        return this.mapRow(playlist);
    }

    async getById(id: string): Promise<UserPlaylistSchema> {
        const [playlist] = await db`
            SELECT * FROM user_playlists WHERE id = ${id}
        `;
        if (!playlist) throw new Error(`User playlist with id ${id} not found`);
        return this.mapRow(playlist);
    }

    async countByUserId(userId: string): Promise<number> {
        const [row] = await db`
            SELECT count(*)::int as count FROM user_playlists WHERE user_id = ${userId}
        `;
        return row?.count || 0;
    }

    /** Returns paginated playlists for a given user. */
    async getByUserId(userId: string, limit?: number, offset?: number): Promise<UserPlaylistSchema[]> {
        const rows = await db`
            SELECT * FROM user_playlists 
            WHERE user_id = ${userId}
            LIMIT ${limit ?? null} OFFSET ${offset ?? null}
        `;
        return rows.map((row) => this.mapRow(row));
    }

    async getAll(): Promise<UserPlaylistSchema[]> {
        const rows = await db`SELECT * FROM user_playlists`;
        return rows.map((row) => this.mapRow(row));
    }

    async update(id: string, data: UpdatePlaylistData): Promise<UserPlaylistSchema> {
        const [playlist] = await db`
            UPDATE user_playlists
            SET
                name    = COALESCE(${data.name ?? null}, name),
                user_id = COALESCE(${data.userId ?? null}, user_id)
            WHERE id = ${id}
            RETURNING *
        `;
        if (!playlist) throw new Error(`User playlist with id ${id} not found`);
        return this.mapRow(playlist);
    }

    async delete(id: string): Promise<UserPlaylistSchema> {
        const [playlist] = await db`
            DELETE FROM user_playlists WHERE id = ${id} RETURNING *
        `;
        if (!playlist) throw new Error(`User playlist with id ${id} not found`);
        return this.mapRow(playlist);
    }

    // ── Playlist ↔ Song join operations ────────────────────────────────────────

    async addSong(playlistId: string, songId: string): Promise<UserPlaylistSongSchema> {
        const id = randomUUIDv7();
        const [entry] = await db`
            INSERT INTO user_playlist_songs (id, playlist_id, song_id)
            VALUES (${id}, ${playlistId}, ${songId})
            ON CONFLICT (playlist_id, song_id) DO NOTHING
            RETURNING *
        `;
        if (!entry) throw new Error("Song already exists in playlist or insert failed");
        return this.mapSongRow(entry);
    }

    async removeSong(playlistId: string, songId: string): Promise<UserPlaylistSongSchema> {
        const [entry] = await db`
            DELETE FROM user_playlist_songs
            WHERE playlist_id = ${playlistId} AND song_id = ${songId}
            RETURNING *
        `;
        if (!entry) throw new Error(`Song ${songId} not found in playlist ${playlistId}`);
        return this.mapSongRow(entry);
    }

    async countSongs(playlistId: string): Promise<number> {
        const [row] = await db`
            SELECT count(*)::int as count FROM user_playlist_songs 
            WHERE playlist_id = ${playlistId}
        `;
        return row?.count || 0;
    }

    async getSongs(playlistId: string, limit?: number, offset?: number): Promise<any[]> {
        const rows = await db`
            SELECT 
                s.id,
                s.title,
                s.artist_name AS "artistName",
                s.duration,
                s.song_key AS "songKey",
                s.image_key AS "imageKey",
                s.language,
                s.job_id AS "jobId",
                s.created_at AS "createdAt"
            FROM user_playlist_songs ups
            JOIN songs s ON s.id = ups.song_id
            WHERE ups.playlist_id = ${playlistId}
            LIMIT ${limit ?? null} OFFSET ${offset ?? null}
        `;
        return rows;
    }

    // Maps DB snake_case row → camelCase UserPlaylistSchema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapRow(row: Record<string, any>): UserPlaylistSchema {
        return {
            id: row.id as string,
            name: row.name as string,
            userId: row.user_id as string,
        };
    }

    // Maps DB snake_case row → camelCase UserPlaylistSongSchema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapSongRow(row: Record<string, any>): UserPlaylistSongSchema {
        return {
            id: row.id as string,
            playlistId: row.playlist_id as string,
            songId: row.song_id as string,
        };
    }
}
