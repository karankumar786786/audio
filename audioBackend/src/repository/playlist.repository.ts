import type { Database } from "../infra/db";
import { playlistSchema, playlistSongSchema, type PlaylistSchema, type PlaylistSongSchema } from "../schema/playlist.schema";
import { songSchema, type SongSchema } from "../schema/songs.schema";
import { BaseRepository } from "./base.repository";
import { logMethods, type Logger } from "../observability";
import { type SignatureService } from "../lib";

type CreatePlaylistData = Omit<PlaylistSchema,  "createdAt" | "updatedAt">;
type UpdatePlaylistData = Partial<CreatePlaylistData>;

export class PlaylistRepository extends BaseRepository<PlaylistSchema, CreatePlaylistData, UpdatePlaylistData> {
    constructor(
        db: Database,
        logger: Logger,
        private readonly signatureService: SignatureService
    ) {
        super(db, "playlists", playlistSchema, logger);
        logMethods(this, this.logger);
    }

    async create(data: CreatePlaylistData): Promise<PlaylistSchema> {
        const id = this.signatureService.generateSignedId();
        const [playlist] = await this.db`
            INSERT INTO playlists (id, name, description, cover_image_key, banner_image_key)
            VALUES (${id}, ${data.name}, ${data.description}, ${data.coverImageKey}, ${data.bannerImageKey})
            RETURNING 
                id, name, description,
                cover_image_key AS "coverImageKey", 
                banner_image_key AS "bannerImageKey", 
                created_at AS "createdAt", 
                updated_at AS "updatedAt"
        `;

        if (!playlist) throw new Error("Failed to create playlist");
        return this.mapRow(playlist);
    }

    async update(id: string, data: UpdatePlaylistData): Promise<PlaylistSchema> {
        this.signatureService.verifyId(id, "playlistId");
        const [playlist] = await this.db`
            UPDATE playlists
            SET
                name             = COALESCE(${data.name ?? null}, name),
                description      = COALESCE(${data.description ?? null}, description),
                cover_image_key  = COALESCE(${data.coverImageKey ?? null}, cover_image_key),
                banner_image_key = COALESCE(${data.bannerImageKey ?? null}, banner_image_key),
                updated_at       = NOW()
            WHERE id = ${id}
            RETURNING 
                id, name, description,
                cover_image_key AS "coverImageKey", 
                banner_image_key AS "bannerImageKey", 
                created_at AS "createdAt", 
                updated_at AS "updatedAt"
        `;

        if (!playlist) throw new Error(`Playlist with id ${id} not found`);
        return this.mapRow(playlist);
    }

    async getAll(limit?: number, offset?: number): Promise<PlaylistSchema[]> {
        const rows = await this.db`
            SELECT 
                id, name, description,
                cover_image_key AS "coverImageKey", 
                banner_image_key AS "bannerImageKey", 
                created_at AS "createdAt", 
                updated_at AS "updatedAt"
            FROM playlists 
            ORDER BY created_at DESC
            LIMIT ${limit ?? null} OFFSET ${offset ?? null}
        `;
        return rows.map((row) => this.mapRow(row));
    }

    override async count(): Promise<number> {
        const [row] = await this.db`SELECT count(*)::int as count FROM playlists`;
        return row?.count || 0;
    }

    // ── Playlist ↔ Song join operations ────────────────────────────────────────

    async addSong(playlistId: string, songId: string): Promise<PlaylistSongSchema> {
        this.signatureService.verifyId(playlistId, "playlistId");
        this.signatureService.verifyId(songId, "songId");
        const id = this.signatureService.generateSignedId();
        const [entry] = await this.db`
            INSERT INTO playlist_songs (id, playlist_id, song_id)
            VALUES (${id}, ${playlistId}, ${songId})
            ON CONFLICT (playlist_id, song_id) DO NOTHING
            RETURNING id, playlist_id AS "playlistId", song_id AS "songId"
        `;
        if (!entry) throw new Error("Song already exists in playlist or insert failed");
        return playlistSongSchema.parse(entry);
    }

    async removeSong(playlistId: string, songId: string): Promise<PlaylistSongSchema> {
        this.signatureService.verifyId(playlistId, "playlistId");
        this.signatureService.verifyId(songId, "songId");
        const [entry] = await this.db`
            DELETE FROM playlist_songs
            WHERE playlist_id = ${playlistId} AND song_id = ${songId}
            RETURNING id, playlist_id AS "playlistId", song_id AS "songId"
        `;
        if (!entry) throw new Error(`Song ${songId} not found in playlist ${playlistId}`);
        return playlistSongSchema.parse(entry);
    }

    async countSongs(playlistId: string): Promise<number> {
        const [row] = await this.db`
            SELECT count(*)::int as count FROM playlist_songs 
            WHERE playlist_id = ${playlistId}
        `;
        return row?.count || 0;
    }

    async getSongs(playlistId: string, limit?: number, offset?: number): Promise<SongSchema[]> {
        this.signatureService.verifyId(playlistId, "playlistId");
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
        return rows.map((row) => songSchema.parse(row));
    }
}
