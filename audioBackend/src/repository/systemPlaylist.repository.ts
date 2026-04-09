import { db } from "../infra";
import { type SystemPlaylistSchema, type SystemPlaylistSongSchema } from "../schema/systemPlaylist.schema";
import type { Repository } from "../type/repository.type";
import { randomUUIDv7 } from "bun";

type CreatePlaylistData = Omit<SystemPlaylistSchema,  "createdAt" | "updatedAt">;
type UpdatePlaylistData = Partial<CreatePlaylistData>;

export class SystemPlaylistRepository implements Repository<SystemPlaylistSchema, CreatePlaylistData, UpdatePlaylistData> {

    async create(data: CreatePlaylistData): Promise<SystemPlaylistSchema> {
        const [playlist] = await db`
            INSERT INTO system_playlists (id, name, cover_image_key, banner_image_key)
            VALUES (
                ${data.id},
                ${data.name},
                ${data.coverImageKey},
                ${data.bannerImageKey}
            )
            RETURNING *
        `;
        if (!playlist) throw new Error("Failed to create system playlist");
        return this.mapRow(playlist);
    }

    async getById(id: string): Promise<SystemPlaylistSchema> {
        const [playlist] = await db`
            SELECT * FROM system_playlists WHERE id = ${id}
        `;
        if (!playlist) throw new Error(`System playlist with id ${id} not found`);
        return this.mapRow(playlist);
    }

    async count(): Promise<number> {
        const [row] = await db`SELECT count(*)::int as count FROM system_playlists`;
        return row?.count || 0;
    }

    async getAll(limit?: number, offset?: number): Promise<SystemPlaylistSchema[]> {
        const rows = await db`
            SELECT * FROM system_playlists 
            ORDER BY created_at DESC
            LIMIT ${limit ?? null} OFFSET ${offset ?? null}
        `;
        return rows.map((row) => this.mapRow(row));
    }

    async update(id: string, data: UpdatePlaylistData): Promise<SystemPlaylistSchema> {
        const [playlist] = await db`
            UPDATE system_playlists
            SET
                name             = COALESCE(${data.name ?? null}, name),
                cover_image_key  = COALESCE(${data.coverImageKey ?? null}, cover_image_key),
                banner_image_key = COALESCE(${data.bannerImageKey ?? null}, banner_image_key),
                updated_at       = NOW()
            WHERE id = ${id}
            RETURNING *
        `;
        if (!playlist) throw new Error(`System playlist with id ${id} not found`);
        return this.mapRow(playlist);
    }

    async delete(id: string): Promise<SystemPlaylistSchema> {
        const [playlist] = await db`
            DELETE FROM system_playlists WHERE id = ${id} RETURNING *
        `;
        if (!playlist) throw new Error(`System playlist with id ${id} not found`);
        return this.mapRow(playlist);
    }

    // ── Playlist ↔ Song join operations ────────────────────────────────────────

    async addSong(playlistId: string, songId: string): Promise<SystemPlaylistSongSchema> {
        const id = randomUUIDv7();
        const [entry] = await db`
            INSERT INTO system_playlist_songs (id, playlist_id, song_id)
            VALUES (${id}, ${playlistId}, ${songId})
            ON CONFLICT (playlist_id, song_id) DO NOTHING
            RETURNING *
        `;
        if (!entry) throw new Error("Song already exists in playlist or insert failed");
        return this.mapSongRow(entry);
    }

    async removeSong(playlistId: string, songId: string): Promise<SystemPlaylistSongSchema> {
        const [entry] = await db`
            DELETE FROM system_playlist_songs
            WHERE playlist_id = ${playlistId} AND song_id = ${songId}
            RETURNING *
        `;
        if (!entry) throw new Error(`Song ${songId} not found in playlist ${playlistId}`);
        return this.mapSongRow(entry);
    }

    async countSongs(playlistId: string): Promise<number> {
        const [row] = await db`
            SELECT count(*)::int as count FROM system_playlist_songs 
            WHERE playlist_id = ${playlistId}
        `;
        return row?.count || 0;
    }

    async getSongs(playlistId: string, limit?: number, offset?: number): Promise<SystemPlaylistSongSchema[]> {
        const rows = await db`
            SELECT * FROM system_playlist_songs 
            WHERE playlist_id = ${playlistId}
            LIMIT ${limit ?? null} OFFSET ${offset ?? null}
        `;
        return rows.map((row) => this.mapSongRow(row));
    }

    // Maps DB snake_case row → camelCase SystemPlaylistSchema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapRow(row: Record<string, any>): SystemPlaylistSchema {
        return {
            id: row.id as string,
            name: row.name as string,
            coverImageKey: row.cover_image_key as string,
            bannerImageKey: row.banner_image_key as string,
            createdAt: (row.created_at as Date)?.toISOString(),
            updatedAt: (row.updated_at as Date)?.toISOString(),
        };
    }

    // Maps DB snake_case row → camelCase SystemPlaylistSongSchema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapSongRow(row: Record<string, any>): SystemPlaylistSongSchema {
        return {
            id: row.id as string,
            playlistId: row.playlist_id as string,
            songId: row.song_id as string,
        };
    }
}
