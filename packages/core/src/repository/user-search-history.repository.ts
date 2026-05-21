import { type DbClient } from "../db/db.ts";
import { userSearchHistorySchema, type UserSearchHistorySchema } from "../schema/userSearchHistory.schema.ts";
import { BaseRepository } from "./base.repository.ts";
import { logMethods, type Logger } from "../utils/index.ts";
import type { SignatureService } from "../infra/signature.types.ts";
import { userSearchHistory } from "../db/schema.ts";
import { eq, and, desc, sql } from "drizzle-orm";

type CreateSearchHistoryData = Omit<UserSearchHistorySchema, "id">;

export class UserSearchHistoryRepository extends BaseRepository<UserSearchHistorySchema, typeof userSearchHistory, CreateSearchHistoryData, any> {
    constructor(
        db: DbClient,
        logger: Logger,
        private readonly signatureService: SignatureService
    ) {
        super(db, userSearchHistory, userSearchHistorySchema, logger);
        logMethods(this, this.logger);
    }

    async create(data: CreateSearchHistoryData): Promise<UserSearchHistorySchema> {
        // We deduplicate by deleting existing entry for same user/text and inserting new
        await this.db
            .delete(userSearchHistory)
            .where(and(eq(userSearchHistory.userId, data.userId), eq(userSearchHistory.searchedText, data.searchedText)));
            
        const id = this.signatureService.generateSignedId();
        const [row] = await this.db
            .insert(userSearchHistory)
            .values({ id, userId: data.userId, searchedText: data.searchedText })
            .returning();
        if (!row) throw new Error("Failed to record search history");
        return this.mapRow(row);
    }

    async update(): Promise<never> {
        throw new Error("Update not supported for search history");
    }

    async getByUserId(userId: string, limit: number, offset: number): Promise<UserSearchHistorySchema[]> {
        const rows = await this.db
            .select()
            .from(userSearchHistory)
            .where(eq(userSearchHistory.userId, userId))
            .orderBy(desc(userSearchHistory.createdAt))
            .limit(limit)
            .offset(offset);
        return rows.map((row) => this.mapRow(row));
    }

    async countByUserId(userId: string): Promise<number> {
        const res = await this.db
            .select({ count: sql<number>`count(*)::int` })
            .from(userSearchHistory)
            .where(eq(userSearchHistory.userId, userId));
        return res[0]?.count || 0;
    }

    async clearByUserId(userId: string): Promise<void> {
        await this.db
            .delete(userSearchHistory)
            .where(eq(userSearchHistory.userId, userId));
    }
}
