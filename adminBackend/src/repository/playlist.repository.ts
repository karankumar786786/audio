import type { Logger } from "../observablity";
import { type PlaylistSchema, type PlaylistSongSchema } from "../schema/playlist.schema";
import { type SongSchema } from "../schema/songs.schema";
import type { Repository } from "../types/repository.type";
import { NotFoundError } from "../errors";
import type { SignatureService } from "../lib/signature";
import type { Database } from "../infra";

type CreatePlaylistData = Omit<PlaylistSchema, "createdAt" | "updatedAt">;
type UpdatePlaylistData = Partial<CreatePlaylistData>;

export class PlaylistRepository implements Repository<PlaylistSchema, CreatePlaylistData, UpdatePlaylistData> {
    constructor(
        private readonly db: Database,
        private readonly logger: Logger,
        private readonly signatureService:SignatureService,
    ) {}

    async create(data: CreatePlaylistData): Promise<void> {
        const [playlist] = await this.db`
            INSERT INTO playlists (id, name, cover_image_key, banner_image_key)
            VALUES (${data.id}, ${data.name}, ${data.coverImageKey}, ${data.bannerImageKey})
            RETURNING id
        `;
        if (!playlist) throw new Error("Failed to create playlist");
        return;
    }

    async getById(id: string): Promise<PlaylistSchema> {
        const [playlist] = await this.db`
            SELECT * FROM playlists WHERE id = ${id}
        `;
        if (!playlist) throw new NotFoundError(`Playlist with id ${id} not found`);
        return this.mapRow(playlist);
    }

    async count(): Promise<number> {
        const [row] = await this.db`SELECT count(*)::int as count FROM playlists`;
        return row?.count || 0;
    }

    async getAll(limit?: number, offset?: number): Promise<PlaylistSchema[]> {
        const rows = await this.db`
            SELECT * FROM playlists 
            ORDER BY created_at DESC
            LIMIT ${limit ?? null} OFFSET ${offset ?? null}
        `;
        return rows.map((row) => this.mapRow(row));
    }

    async update(id: string, data: UpdatePlaylistData): Promise<void> {
        const [playlist] = await this.db`
            UPDATE playlists
            SET
                name             = COALESCE(${data.name ?? null}, name),
                cover_image_key  = COALESCE(${data.coverImageKey ?? null}, cover_image_key),
                banner_image_key = COALESCE(${data.bannerImageKey ?? null}, banner_image_key),
                updated_at       = NOW()
            WHERE id = ${id}
            RETURNING id
        `;
        if (!playlist) throw new NotFoundError(`Playlist with id ${id} not found`);
        return;
    }

    async delete(id: string): Promise<void> {
        const [playlist] = await this.db`
            DELETE FROM playlists WHERE id = ${id} RETURNING id
        `;
        if (!playlist) throw new NotFoundError(`Playlist with id ${id} not found`);
        return ;
    }

    // ── Playlist ↔ Song join operations ────────────────────────────────────────

    async addSong(data:PlaylistSongSchema): Promise<void> {
        const id = this.signatureService.generateSignedId();
        const [entry] = await this.db`
            INSERT INTO playlist_songs (id, playlist_id, song_id)
            VALUES (${id}, ${data.playlistId}, ${data.songId})
            ON CONFLICT (playlist_id, song_id) DO NOTHING
            RETURNING id
        `;
        if (!entry) throw new Error("Song already exists in playlist or insert failed");
        return;
    }

    async removeSong(data:PlaylistSongSchema): Promise<void> {
        const [entry] = await this.db`
            DELETE FROM playlist_songs
            WHERE playlist_id = ${data.playlistId} AND song_id = ${data.songId}
            RETURNING id
        `;
        if (!entry) throw new NotFoundError(`Song ${data.songId} not found in playlist ${data.playlistId}`);
        return;
    }

    async countSongs(playlistId: string): Promise<number> {
        const [row] = await this.db`
            SELECT count(*)::int as count FROM playlist_songs 
            WHERE playlist_id = ${playlistId}
        `;
        return row?.count || 0;
    }

    async getSongs(playlistId: string, limit?: number, offset?: number): Promise<SongSchema[]> {
        const rows = await this.db`
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
            FROM playlist_songs sps
            JOIN songs s ON s.id = sps.song_id
            WHERE sps.playlist_id = ${playlistId}
            LIMIT ${limit ?? null} OFFSET ${offset ?? null}
        `;
        return rows as any as SongSchema[];
    }

    // Maps DB snake_case row → camelCase PlaylistSchema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapRow(row: Record<string, any>): PlaylistSchema {
        return {
            id: row.id as string,
            name: row.name as string,
            coverImageKey: row.cover_image_key as string,
            bannerImageKey: row.banner_image_key as string,
            createdAt: (row.created_at as Date)?.toISOString(),
            updatedAt: (row.updated_at as Date)?.toISOString(),
        };
    }

    // Maps DB snake_case row → camelCase PlaylistSongSchema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapSongRow(row: Record<string, any>): PlaylistSongSchema {
        return {
            id: row.id as string,
            playlistId: row.playlist_id as string,
            songId: row.song_id as string,
        };
    }
}

