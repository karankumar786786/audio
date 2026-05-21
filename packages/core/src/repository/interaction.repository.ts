import { type DbClient } from "../db/db.ts";
import { songSchema, type SongSchema } from "../schema/songs.schema.ts";
import { BaseRepository } from "./base.repository.ts";
import { logMethods, type Logger } from "../utils/index.ts";
import type { SignatureService } from "../infra/signature.types.ts";
import { userHistory, songs } from "../db/schema.ts";
import { eq, sql } from "drizzle-orm";

export class InteractionRepository extends BaseRepository<SongSchema, typeof userHistory, any, any> {
    constructor(
        db: DbClient,
        logger: Logger,
        private readonly signatureService: SignatureService
    ) {
        super(db, userHistory, songSchema, logger);
        logMethods(this, this.logger);
    }

    async create(): Promise<never> {
        throw new Error("InteractionRepository does not support direct creation - use UserHistory instead");
    }

    async update(): Promise<never> {
        throw new Error("Update not supported");
    }

    async getTrendingSongs(limit: number, offset: number): Promise<SongSchema[]> {
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
            .from(userHistory)
            .innerJoin(songs, eq(userHistory.songId, songs.id))
            .where(sql`${userHistory.listenedAt} > NOW() - INTERVAL '7 days'`)
            .groupBy(songs.id)
            .orderBy(sql`COUNT(${userHistory.id}) DESC, RANDOM()`)
            .limit(limit)
            .offset(offset);
        return rows.map((row) => this.mapRow(row));
    }

    async countTrendingSongs(): Promise<number> {
        const res = await this.db
            .select({ count: sql<number>`COUNT(DISTINCT ${userHistory.songId})::int` })
            .from(userHistory);
        return res[0]?.count || 0;
    }
}
