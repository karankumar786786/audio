import type { Database } from "../infra/db";
import { userSearchHistorySchema, type UserSearchHistorySchema } from "../schema/userSearchHistory.schema";
import { BaseRepository } from "./base.repository";
import { logMethods, type Logger } from "../observability";
import type { SignatureService } from "../lib";

type CreateSearchHistoryData = Omit<UserSearchHistorySchema, "id">;

export class UserSearchHistoryRepository extends BaseRepository<UserSearchHistorySchema, CreateSearchHistoryData, any> {
    constructor(
        db: Database,
        logger: Logger,
        private readonly signatureService: SignatureService
    ) {
        super(db, "user_search_history", userSearchHistorySchema, logger);
        logMethods(this, this.logger);
    }

    async create(data: CreateSearchHistoryData): Promise<UserSearchHistorySchema> {
        // We deduplicate by deleting existing entry for same user/text and inserting new
        await this.db`
            DELETE FROM user_search_history 
            WHERE user_id = ${data.userId} AND searched_text = ${data.searchedText}
        `;
        const id = this.signatureService.generateSignedId();
        const [entry] = await this.db`
            INSERT INTO user_search_history (id, user_id, searched_text)
            VALUES (${id}, ${data.userId}, ${data.searchedText})
            RETURNING id, user_id AS "userId", searched_text AS "searchedText"
        `;
        if (!entry) throw new Error("Failed to record search history");
        return this.mapRow(entry);
    }

    async update(): Promise<never> {
        throw new Error("Update not supported for search history");
    }

    async getByUserId(userId: string, limit: number, offset: number): Promise<UserSearchHistorySchema[]> {
        const rows = await this.db`
            SELECT id, user_id AS "userId", searched_text AS "searchedText"
            FROM user_search_history
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `;
        return rows.map((row) => this.mapRow(row));
    }

    async countByUserId(userId: string): Promise<number> {
        const [row] = await this.db`
            SELECT COUNT(*) AS count
            FROM user_search_history
            WHERE user_id = ${userId}
        `;
        return parseInt(row?.count || "0");
    }

    async clearByUserId(userId: string): Promise<void> {
        await this.db`
            DELETE FROM user_search_history WHERE user_id = ${userId}
        `;
    }
}
