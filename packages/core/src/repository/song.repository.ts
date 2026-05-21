import { type DbClient } from "../db/db.ts";
import { songSchema, type SongSchema } from "../schema/songs.schema.ts";
import { BaseRepository } from "./base.repository.ts";
import { logMethods, type Logger } from "../utils/index.ts";
import type { SignatureService } from "../infra/signature.types.ts";
import { songs } from "../db/schema.ts";
import { eq, desc, sql, inArray } from "drizzle-orm";

type CreateSongData = Omit<SongSchema, "createdAt">;
type partial = Partial<CreateSongData>;
type UpdateSongData = Omit<partial, "songKey" | "language" | "jobId" | "duration">;

export class SongRepository extends BaseRepository<SongSchema, typeof songs, CreateSongData, UpdateSongData> {
    constructor(
        db: DbClient,
        logger: Logger,
        private readonly signatureService: SignatureService
    ) {
        super(db, songs, songSchema, logger);
        logMethods(this, this.logger);
    }

    async create(data: CreateSongData): Promise<SongSchema> {
        const id = data.id || this.signatureService.generateSignedId();
        const [row] = await this.db
            .insert(songs)
            .values({
                id,
                title: data.title,
                artistName: data.artistName,
                duration: data.duration,
                songKey: data.songKey,
                imageKey: data.imageKey,
                language: data.language,
                jobId: data.jobId
            })
            .returning();
        if (!row) throw new Error("Failed to create song");
        return this.mapRow(row);
    }

    async update(id: string, data: UpdateSongData): Promise<SongSchema> {
        this.signatureService.verifyId(id, "songId");
        
        const setClause: Partial<typeof songs.$inferInsert> = {};
        if (data.title !== undefined) setClause.title = data.title;
        if (data.artistName !== undefined) setClause.artistName = data.artistName;
        if (data.imageKey !== undefined) setClause.imageKey = data.imageKey;

        const [row] = await this.db
            .update(songs)
            .set(setClause)
            .where(eq(songs.id, id))
            .returning();
        if (!row) throw new Error(`Song with id ${id} not found`);
        return this.mapRow(row);
    }

    async getAll(limit?: number, offset?: number): Promise<SongSchema[]> {
        let q = this.db.select().from(songs).orderBy(desc(songs.createdAt)).$dynamic();
        if (limit !== undefined) q = q.limit(limit);
        if (offset !== undefined) q = q.offset(offset);
        const rows = await q;
        return rows.map((row) => this.mapRow(row));
    }

    async getByArtistName(name: string, limit: number, offset: number): Promise<SongSchema[]> {
        const normalizedName = `%${name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}%`;
        const rows = await this.db
            .select()
            .from(songs)
            .where(sql`regexp_replace(COALESCE(${songs.artistName}, ''), '[^a-zA-Z0-9]', '', 'g') ILIKE ${normalizedName}`)
            .orderBy(desc(songs.createdAt))
            .limit(limit)
            .offset(offset);
        return rows.map((row) => this.mapRow(row));
    }

    async getArtistSongs(name: string, limit: number, offset: number): Promise<SongSchema[]> {
        // Support both regex and replacement approaches by delegating to regex check which is more comprehensive
        return this.getByArtistName(name, limit, offset);
    }

    async countByArtistName(name: string): Promise<number> {
        const normalizedName = `%${name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}%`;
        const res = await this.db
            .select({ count: sql<number>`count(*)::int` })
            .from(songs)
            .where(sql`regexp_replace(COALESCE(${songs.artistName}, ''), '[^a-zA-Z0-9]', '', 'g') ILIKE ${normalizedName}`);
        return res[0]?.count || 0;
    }

    async getByIds(ids: string[]): Promise<SongSchema[]> {
        if (ids.length === 0) return [];
        const rows = await this.db
            .select()
            .from(songs)
            .where(inArray(songs.id, ids));
        return rows.map((row) => this.mapRow(row));
    }

    async getByBaseIds(baseIds: string[]): Promise<SongSchema[]> {
        if (baseIds.length === 0) return [];
        const rows = await this.db
            .select()
            .from(songs)
            .where(sql`split_part(${songs.id}, '.', 1) = ANY(${baseIds})`);
        return rows.map((row) => this.mapRow(row));
    }

    async getRandom(limit: number): Promise<SongSchema[]> {
        const rows = await this.db
            .select()
            .from(songs)
            .orderBy(sql`RANDOM()`)
            .limit(limit);
        return rows.map((row) => this.mapRow(row));
    }

    async getStats(): Promise<any> {
        const res = await this.db
            .select({
                total_songs: sql<number>`COUNT(*)::int`,
                total_duration: sql<number>`SUM(${songs.duration})::int`
            })
            .from(songs);
        return res[0];
    }
}
