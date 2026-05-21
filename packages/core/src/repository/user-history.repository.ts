import { type DbClient } from "../db/db.ts";
import { userHistorySchema, type UserHistorySchema, historyEventSchema, type HistoryEvent } from "../schema/userHistory.schema.ts";
import { BaseRepository } from "./base.repository.ts";
import { logMethods, type Logger } from "../utils/index.ts";
import type { SignatureService } from "../infra/signature.types.ts";
import { userHistory, songs } from "../db/schema.ts";
import { eq, desc, sql } from "drizzle-orm";

type CreateHistoryData = Omit<UserHistorySchema, "id" | "listenedAt">;

export class UserHistoryRepository extends BaseRepository<UserHistorySchema, typeof userHistory, CreateHistoryData, any> {
    constructor(
        db: DbClient,
        logger: Logger,
        private readonly signatureService: SignatureService,
    ) {
        super(db, userHistory, userHistorySchema, logger);
        logMethods(this, this.logger);
    }

    async create(data: CreateHistoryData): Promise<UserHistorySchema> {
        const id = this.signatureService.generateSignedId();
        this.signatureService.verifyId(data.songId, "songId");
        this.signatureService.verifyId(data.userId, "userId");
        const [row] = await this.db
            .insert(userHistory)
            .values({ id, userId: data.userId, songId: data.songId, part: data.part })
            .returning();
        if (!row) throw new Error("Failed to record history");
        return this.mapRow(row);
    }

    async update(): Promise<never> {
        throw new Error("Update not supported for history");
    }

    async getByUserId(userId: string, limit: number, offset: number): Promise<HistoryEvent[]> {
        const rows = await this.db
            .select({
                historyId: userHistory.id,
                listenedAt: userHistory.listenedAt,
                part: userHistory.part,
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
            .innerJoin(songs, eq(songs.id, userHistory.songId))
            .where(eq(userHistory.userId, userId))
            .orderBy(desc(userHistory.listenedAt))
            .limit(limit)
            .offset(offset);
        return rows.map((row) => historyEventSchema.parse(row));
    }

    async countByUserId(userId: string): Promise<number> {
        const res = await this.db
            .select({ count: sql<number>`count(*)::int` })
            .from(userHistory)
            .where(eq(userHistory.userId, userId));
        return res[0]?.count || 0;
    }
}
