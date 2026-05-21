import { type DbClient } from "../db/db.ts";
import { userFavouriteSongSchema, type UserFavouriteSongSchema } from "../schema/userFavouriteSong.schema.ts";
import { songSchema, type SongSchema } from "../schema/songs.schema.ts";
import { BaseRepository } from "./base.repository.ts";
import { logMethods, type Logger } from "../utils/index.ts";
import type { SignatureService } from "../infra/signature.types.ts";
import { userFavouriteSongs, songs } from "../db/schema.ts";
import { eq, and, sql } from "drizzle-orm";
import { NotFoundError } from "../errors/index.ts";

type CreateFavData = Omit<UserFavouriteSongSchema, "id">;

export class UserFavouriteSongRepository extends BaseRepository<UserFavouriteSongSchema, typeof userFavouriteSongs, CreateFavData, any> {
    constructor(
        db: DbClient,
        logger: Logger,
        private readonly signatureService: SignatureService
    ) {
        super(db, userFavouriteSongs, userFavouriteSongSchema, logger);
        logMethods(this, this.logger);
    }

    async create(data: CreateFavData): Promise<UserFavouriteSongSchema> {
        const id = this.signatureService.generateSignedId();
        const [row] = await this.db
            .insert(userFavouriteSongs)
            .values({ id, userId: data.userId, songId: data.songId })
            .onConflictDoUpdate({
                target: [userFavouriteSongs.userId, userFavouriteSongs.songId],
                set: { userId: data.userId }
            })
            .returning();
        if (!row) throw new Error("Failed to create favourite");
        return this.mapRow(row);
    }

    async update(): Promise<never> {
        throw new Error("Update not supported for favourites");
    }

    async getByUserAndSong(userId: string, songId: string): Promise<UserFavouriteSongSchema | null> {
        const rows = await this.db
            .select()
            .from(userFavouriteSongs)
            .where(and(eq(userFavouriteSongs.userId, userId), eq(userFavouriteSongs.songId, songId)))
            .limit(1);
        const row = rows[0];
        return row ? this.mapRow(row) : null;
    }

    async getByUserId(userId: string, limit: number, offset: number): Promise<SongSchema[]> {
        const rows = await this.db
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
            .from(userFavouriteSongs)
            .innerJoin(songs, eq(songs.id, userFavouriteSongs.songId))
            .where(eq(userFavouriteSongs.userId, userId))
            .limit(limit)
            .offset(offset);
        return rows.map((row) => songSchema.parse(row));
    }

    async deleteFavorite(userId: string, songId: string): Promise<UserFavouriteSongSchema> {
        this.signatureService.verifyId(userId, "userId");
        this.signatureService.verifyId(songId, "songId");
        
        const [row] = await this.db
            .delete(userFavouriteSongs)
            .where(and(eq(userFavouriteSongs.userId, userId), eq(userFavouriteSongs.songId, songId)))
            .returning();
        if (!row) throw new NotFoundError("Favourite not found");
        return this.mapRow(row);
    }

    async countByUserId(userId: string): Promise<number> {
        const res = await this.db
            .select({ count: sql<number>`count(*)::int` })
            .from(userFavouriteSongs)
            .where(eq(userFavouriteSongs.userId, userId));
        return res[0]?.count || 0;
    }
}
