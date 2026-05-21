import { type DbClient } from "../db/db.ts";
import { type UserPlaylistSchema, type UserPlaylistSongSchema, userPlaylistSchema, userPlaylistSongSchema } from "../schema/userPlaylist.schema.ts";
import { songSchema, type SongSchema } from "../schema/songs.schema.ts";
import { BaseRepository } from "./base.repository.ts";
import { logMethods, type Logger } from "../utils/index.ts";
import type { SignatureService } from "../infra/signature.types.ts";
import { userPlaylists, userPlaylistSongs, songs } from "../db/schema.ts";
import { eq, and, sql } from "drizzle-orm";

type UpdatePlaylistData = Partial<UserPlaylistSchema>;

export class UserPlaylistRepository extends BaseRepository<UserPlaylistSchema, typeof userPlaylists, Omit<UserPlaylistSchema, "id">, UpdatePlaylistData> {
    constructor(
        db: DbClient,
        logger: Logger,
        private readonly signatureService: SignatureService
    ) {
        super(db, userPlaylists, userPlaylistSchema, logger);
        logMethods(this, this.logger);
    }

    async create(data: Omit<UserPlaylistSchema, "id">): Promise<UserPlaylistSchema> {
        const id = this.signatureService.generateSignedId();
        const [row] = await this.db
            .insert(userPlaylists)
            .values({ id, name: data.name, userId: data.userId })
            .returning();
        if (!row) throw new Error("Failed to create user playlist");
        return this.mapRow(row);
    }

    async countByUserId(userId: string): Promise<number> {
        const res = await this.db
            .select({ count: sql<number>`count(*)::int` })
            .from(userPlaylists)
            .where(eq(userPlaylists.userId, userId));
        return res[0]?.count || 0;
    }

    async getByUserId(userId: string, limit?: number, offset?: number): Promise<UserPlaylistSchema[]> {
        let q = this.db.select().from(userPlaylists).where(eq(userPlaylists.userId, userId)).$dynamic();
        if (limit !== undefined) q = q.limit(limit);
        if (offset !== undefined) q = q.offset(offset);
        const rows = await q;
        return rows.map((row) => this.mapRow(row));
    }

    async getAll(): Promise<UserPlaylistSchema[]> {
        const rows = await this.db.select().from(userPlaylists);
        return rows.map((row) => this.mapRow(row));
    }

    async update(id: string, data: UpdatePlaylistData): Promise<UserPlaylistSchema> {
        this.signatureService.verifyId(id, "userPlaylistId");
        
        const setClause: Partial<typeof userPlaylists.$inferInsert> = {};
        if (data.name !== undefined) setClause.name = data.name;
        if (data.userId !== undefined) setClause.userId = data.userId;

        const [row] = await this.db
            .update(userPlaylists)
            .set(setClause)
            .where(eq(userPlaylists.id, id))
            .returning();
        if (!row) throw new Error(`User playlist with id ${id} not found`);
        return this.mapRow(row);
    }

    // ── Playlist ↔ Song join operations ────────────────────────────────────────

    async addSong(playlistId: string, songId: string): Promise<UserPlaylistSongSchema> {
        this.signatureService.verifyId(playlistId, "userPlaylistId");
        this.signatureService.verifyId(songId, "songId");
        const id = this.signatureService.generateSignedId();
        const [row] = await this.db
            .insert(userPlaylistSongs)
            .values({ id, playlistId, songId })
            .onConflictDoNothing()
            .returning();
        if (!row) throw new Error("Song already exists in playlist or insert failed");
        return userPlaylistSongSchema.parse(row);
    }

    async removeSong(playlistId: string, songId: string): Promise<UserPlaylistSongSchema> {
        this.signatureService.verifyId(playlistId, "userPlaylistId");
        this.signatureService.verifyId(songId, "songId");
        const [row] = await this.db
            .delete(userPlaylistSongs)
            .where(and(eq(userPlaylistSongs.playlistId, playlistId), eq(userPlaylistSongs.songId, songId)))
            .returning();
        if (!row) throw new Error(`Song ${songId} not found in playlist ${playlistId}`);
        return userPlaylistSongSchema.parse(row);
    }

    async countSongs(playlistId: string): Promise<number> {
        const res = await this.db
            .select({ count: sql<number>`count(*)::int` })
            .from(userPlaylistSongs)
            .where(eq(userPlaylistSongs.playlistId, playlistId));
        return res[0]?.count || 0;
    }

    async getSongs(playlistId: string, limit?: number, offset?: number): Promise<SongSchema[]> {
        this.signatureService.verifyId(playlistId, "userPlaylistId");
        let q = this.db
            .select({
                id: songs.id,
                title: songs.title,
                artistName: songs.artistName,
                duration: songs.duration,
                songKey: songs.songKey,
                imageKey: songs.imageKey,
                language: songs.language,
                jobId: songs.jobId,
                createdAt: songs.createdAt
            })
            .from(userPlaylistSongs)
            .innerJoin(songs, eq(songs.id, userPlaylistSongs.songId))
            .where(eq(userPlaylistSongs.playlistId, playlistId))
            .$dynamic();

        if (limit !== undefined) q = q.limit(limit);
        if (offset !== undefined) q = q.offset(offset);
        const rows = await q;
        return rows.map((row) => songSchema.parse(row));
    }
}
