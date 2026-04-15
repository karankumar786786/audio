import type { Database } from "../infra/db";
import { type UserPlaylistSchema, type UserPlaylistSongSchema } from "../schema/userPlaylist.schema";
import { songSchema, type SongSchema } from "../schema/songs.schema";
import type { Repository } from "../type/repository.type";
import { logMethods, type Logger } from "../observability";
import { type SignatureService } from "../lib";

type UpdatePlaylistData = Partial<UserPlaylistSchema>;

export class UserPlaylistRepository implements Repository<UserPlaylistSchema, UserPlaylistSchema, UpdatePlaylistData> {
    constructor(
        private readonly db: Database,
        private readonly logger: Logger,
        private readonly signatureService: SignatureService
    ) {
        logMethods(this, this.logger);
    }

    async create(data: Omit<UserPlaylistSchema, "id">): Promise<UserPlaylistSchema> {
        const id = this.signatureService.generateSignedId();
        const [playlist] = await this.db`
            INSERT INTO user_playlists (id, name, user_id)
            VALUES (
                ${id},
                ${data.name},
                ${data.userId}
            )
            RETURNING id, name, user_id AS "userId"
        `;
        if (!playlist) throw new Error("Failed to create user playlist");
        return this.mapRow(playlist);
    }

    async getById(id: string): Promise<UserPlaylistSchema> {
        this.signatureService.verifyId(id, "userPlaylistId");
        const [playlist] = await this.db`
            SELECT id, name, user_id AS "userId" FROM user_playlists WHERE id = ${id}
        `;
        if (!playlist) throw new Error(`User playlist with id ${id} not found`);
        return this.mapRow(playlist);
    }

    async countByUserId(userId: string): Promise<number> {
        const [row] = await this.db`
            SELECT count(*)::int as count FROM user_playlists WHERE user_id = ${userId}
        `;
        return row?.count || 0;
    }

    /** Returns paginated playlists for a given user. */
    async getByUserId(userId: string, limit?: number, offset?: number): Promise<UserPlaylistSchema[]> {
        const rows = await this.db`
            SELECT id, name, user_id AS "userId" FROM user_playlists 
            WHERE user_id = ${userId}
            LIMIT ${limit ?? null} OFFSET ${offset ?? null}
        `;
        return rows.map((row) => this.mapRow(row));
    }

    async getAll(): Promise<UserPlaylistSchema[]> {
        const rows = await this.db`SELECT id, name, user_id AS "userId" FROM user_playlists`;
        return rows.map((row) => this.mapRow(row));
    }

    async update(id: string, data: UpdatePlaylistData): Promise<UserPlaylistSchema> {
        this.signatureService.verifyId(id, "userPlaylistId");
        const [playlist] = await this.db`
            UPDATE user_playlists
            SET
                name    = COALESCE(${data.name ?? null}, name),
                user_id = COALESCE(${data.userId ?? null}, user_id)
            WHERE id = ${id}
            RETURNING id, name, user_id AS "userId"
        `;
        if (!playlist) throw new Error(`User playlist with id ${id} not found`);
        return this.mapRow(playlist);
    }

    async delete(id: string): Promise<UserPlaylistSchema> {
        this.signatureService.verifyId(id, "userPlaylistId");
        const [playlist] = await this.db`
            DELETE FROM user_playlists WHERE id = ${id} RETURNING id, name, user_id AS "userId"
        `;
        if (!playlist) throw new Error(`User playlist with id ${id} not found`);
        return this.mapRow(playlist);
    }

    // ── Playlist ↔ Song join operations ────────────────────────────────────────

    async addSong(playlistId: string, songId: string): Promise<UserPlaylistSongSchema> {
        this.signatureService.verifyId(playlistId, "userPlaylistId");
        this.signatureService.verifyId(songId, "songId");
        const id = this.signatureService.generateSignedId();
        const [entry] = await this.db`
            INSERT INTO user_playlist_songs (id, playlist_id, song_id)
            VALUES (${id}, ${playlistId}, ${songId})
            ON CONFLICT (playlist_id, song_id) DO NOTHING
            RETURNING id, playlist_id AS "playlistId", song_id AS "songId"
        `;
        if (!entry) throw new Error("Song already exists in playlist or insert failed");
        return this.mapSongRow(entry);
    }

    async removeSong(playlistId: string, songId: string): Promise<UserPlaylistSongSchema> {
        this.signatureService.verifyId(playlistId, "userPlaylistId");
        this.signatureService.verifyId(songId, "songId");
        const [entry] = await this.db`
            DELETE FROM user_playlist_songs
            WHERE playlist_id = ${playlistId} AND song_id = ${songId}
            RETURNING id, playlist_id AS "playlistId", song_id AS "songId"
        `;
        if (!entry) throw new Error(`Song ${songId} not found in playlist ${playlistId}`);
        return this.mapSongRow(entry);
    }

    async countSongs(playlistId: string): Promise<number> {
        const [row] = await this.db`
            SELECT count(*)::int as count FROM user_playlist_songs 
            WHERE playlist_id = ${playlistId}
        `;
        return row?.count || 0;
    }

    async getSongs(playlistId: string, limit?: number, offset?: number): Promise<SongSchema[]> {
        this.signatureService.verifyId(playlistId, "userPlaylistId");
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
            FROM user_playlist_songs ups
            JOIN songs s ON s.id = ups.song_id
            WHERE ups.playlist_id = ${playlistId}
            LIMIT ${limit ?? null} OFFSET ${offset ?? null}
        `;
        return rows.map(row => songSchema.parse(row));
    }

    // Maps DB row → camelCase UserPlaylistSchema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapRow(row: Record<string, any>): UserPlaylistSchema {
        return {
            id: row.id as string,
            name: row.name as string,
            userId: row.userId as string,
        };
    }

    // Maps DB row → camelCase UserPlaylistSongSchema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapSongRow(row: Record<string, any>): UserPlaylistSongSchema {
        return {
            id: row.id as string,
            playlistId: row.playlistId as string,
            songId: row.songId as string,
        };
    }
}
