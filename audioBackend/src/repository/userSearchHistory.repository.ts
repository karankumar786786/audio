import { db } from "../infra";
import { type UserSearchHistorySchema } from "../schema/userSearchHistory.schema";
import type { Repository } from "../type/repository.type";
import { randomUUIDv7 } from "bun";


type UpdateSearchData = Partial<UserSearchHistorySchema>;

export class UserSearchHistoryRepository implements Repository<UserSearchHistorySchema, UserSearchHistorySchema, UpdateSearchData> {

    async create(data: UserSearchHistorySchema): Promise<UserSearchHistorySchema> {
        const [entry] = await db`
            INSERT INTO user_search_history (id, user_id, searched_text)
            VALUES (${data.id}, ${data.userId}, ${data.searchedText})
            RETURNING *
        `;
        if (!entry) throw new Error("Failed to record search history");
        return this.mapRow(entry);
    }

    async getById(id: string): Promise<UserSearchHistorySchema> {
        const [entry] = await db`
            SELECT * FROM user_search_history WHERE id = ${id}
        `;
        if (!entry) throw new Error(`Search history entry with id ${id} not found`);
        return this.mapRow(entry);
    }

    async countByUserId(userId: string): Promise<number> {
        const [row] = await db`
            SELECT count(*)::int as count FROM user_search_history WHERE user_id = ${userId}
        `;
        return row?.count || 0;
    }

    async getByUserId(userId: string, limit?: number, offset?: number): Promise<UserSearchHistorySchema[]> {
        const rows = await db`
            SELECT * FROM user_search_history 
            WHERE user_id = ${userId} 
            ORDER BY id DESC -- UUIDv7 is sortable by time
            LIMIT ${limit ?? null} OFFSET ${offset ?? null}
        `;
        return rows.map((row) => this.mapRow(row));
    }

    async getAll(): Promise<UserSearchHistorySchema[]> {
        const rows = await db`SELECT * FROM user_search_history ORDER BY id DESC`;
        return rows.map((row) => this.mapRow(row));
    }

    async update(id: string, _data: UpdateSearchData): Promise<UserSearchHistorySchema> {
        // Search history entry text is typically not updated
        return this.getById(id);
    }

    async delete(id: string): Promise<UserSearchHistorySchema> {
        const [entry] = await db`
            DELETE FROM user_search_history WHERE id = ${id} RETURNING *
        `;
        if (!entry) throw new Error(`Search history entry with id ${id} not found`);
        return this.mapRow(entry);
    }

    async clearUserHistory(userId: string): Promise<void> {
        await db`
            DELETE FROM user_search_history WHERE user_id = ${userId}
        `;
    }

    // Maps DB snake_case row → camelCase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapRow(row: Record<string, any>): UserSearchHistorySchema {
        return {
            id: row.id as string,
            userId: row.user_id as string,
            searchedText: row.searched_text as string,
        };
    }
}
