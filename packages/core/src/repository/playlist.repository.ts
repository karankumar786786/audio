import { type DbClient } from "../db/db.ts";
import { playlistSchema, playlistSongSchema, type PlaylistSchema, type PlaylistSongSchema } from "../schema/playlist.schema.ts";
import { songSchema, type SongSchema } from "../schema/songs.schema.ts";
import { BaseRepository } from "./base.repository.ts";
import { logMethods, type Logger } from "../utils/index.ts";
import type { SignatureService } from "../infra/signature.types.ts";
import { playlists, playlistSongs, songs } from "../db/schema.ts";
import { eq, desc, sql, and } from "drizzle-orm";

type CreatePlaylistData = Omit<PlaylistSchema, "createdAt" | "updatedAt">;
type UpdatePlaylistData = Partial<CreatePlaylistData>;

export class PlaylistRepository extends BaseRepository<PlaylistSchema, typeof playlists, CreatePlaylistData, UpdatePlaylistData> {
    constructor(
        db: DbClient,
        logger: Logger,
        private readonly signatureService: SignatureService
    ) {
        super(db, playlists, playlistSchema, logger);
        logMethods(this, this.logger);
    }

    async create(data: CreatePlaylistData): Promise<PlaylistSchema> {
        const id = data.id || this.signatureService.generateSignedId();
        const [row] = await this.db
            .insert(playlists)
            .values({
                id,
                name: data.name,
                description: data.description,
                coverImageKey: data.coverImageKey,
                bannerImageKey: data.bannerImageKey
            })
            .returning();
        if (!row) throw new Error("Failed to create playlist");
        return this.mapRow(row);
    }

    async update(id: string, data: UpdatePlaylistData): Promise<PlaylistSchema> {
        this.signatureService.verifyId(id, "playlistId");
        
        const setClause: Partial<typeof playlists.$inferInsert> = {
            updatedAt: new Date()
        };
        if (data.name !== undefined) setClause.name = data.name;
        if (data.description !== undefined) setClause.description = data.description;
        if (data.coverImageKey !== undefined) setClause.coverImageKey = data.coverImageKey;
        if (data.bannerImageKey !== undefined) setClause.bannerImageKey = data.bannerImageKey;

        const [row] = await this.db
            .update(playlists)
            .set(setClause)
            .where(eq(playlists.id, id))
            .returning();
        if (!row) throw new Error(`Playlist with id ${id} not found`);
        return this.mapRow(row);
    }

    async getAll(limit?: number, offset?: number): Promise<PlaylistSchema[]> {
        let q = this.db.select().from(playlists).orderBy(desc(playlists.createdAt)).$dynamic();
        if (limit !== undefined) q = q.limit(limit);
        if (offset !== undefined) q = q.offset(offset);
        const rows = await q;
        return rows.map((row) => this.mapRow(row));
    }

    async addSong(playlistIdOrData: string | PlaylistSongSchema, maybeSongId?: string): Promise<PlaylistSongSchema> {
        let playlistId: string;
        let songId: string;
        if (typeof playlistIdOrData === "object" && playlistIdOrData !== null) {
            playlistId = playlistIdOrData.playlistId;
            songId = playlistIdOrData.songId;
        } else {
            playlistId = playlistIdOrData as string;
            songId = maybeSongId!;
        }

        this.signatureService.verifyId(playlistId, "playlistId");
        this.signatureService.verifyId(songId, "songId");
        
        const id = this.signatureService.generateSignedId();
        const [row] = await this.db
            .insert(playlistSongs)
            .values({ id, playlistId, songId })
            .onConflictDoNothing()
            .returning();
        if (!row) throw new Error("Song already exists in playlist or insert failed");
        return playlistSongSchema.parse(row);
    }

    async removeSong(playlistIdOrData: string | PlaylistSongSchema, maybeSongId?: string): Promise<PlaylistSongSchema> {
        let playlistId: string;
        let songId: string;
        if (typeof playlistIdOrData === "object" && playlistIdOrData !== null) {
            playlistId = playlistIdOrData.playlistId;
            songId = playlistIdOrData.songId;
        } else {
            playlistId = playlistIdOrData as string;
            songId = maybeSongId!;
        }

        this.signatureService.verifyId(playlistId, "playlistId");
        this.signatureService.verifyId(songId, "songId");
        
        const [row] = await this.db
            .delete(playlistSongs)
            .where(and(eq(playlistSongs.playlistId, playlistId), eq(playlistSongs.songId, songId)))
            .returning();
        if (!row) throw new Error(`Song ${songId} not found in playlist ${playlistId}`);
        return playlistSongSchema.parse(row);
    }

    async countSongs(playlistId: string): Promise<number> {
        const res = await this.db
            .select({ count: sql<number>`count(*)::int` })
            .from(playlistSongs)
            .where(eq(playlistSongs.playlistId, playlistId));
        return res[0]?.count || 0;
    }

    async getSongs(playlistId: string, limit?: number, offset?: number): Promise<SongSchema[]> {
        this.signatureService.verifyId(playlistId, "playlistId");
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
            .from(playlistSongs)
            .innerJoin(songs, eq(songs.id, playlistSongs.songId))
            .where(eq(playlistSongs.playlistId, playlistId))
            .$dynamic();

        if (limit !== undefined) q = q.limit(limit);
        if (offset !== undefined) q = q.offset(offset);
        const rows = await q;
        return rows.map((row) => songSchema.parse(row));
    }

    override async delete(id: string): Promise<PlaylistSchema> {
        this.signatureService.verifyId(id, "playlistId");
        this.logger.info({ playlistId: id }, `[PlaylistRepository] Deleting playlist and its associations`);
        
        await this.db.delete(playlistSongs).where(eq(playlistSongs.playlistId, id));
        return await super.delete(id);
    }
}
