import { db } from "../infra";
import { type UserHistorySchema } from "../schema/user_history.schema";
import type { Repository } from "../type/repository.type";
import { randomUUIDv7 } from "bun";

type CreateHistoryData = Omit<UserHistorySchema, "id" | "listenedAt">;
type UpdateHistoryData = Partial<CreateHistoryData>;

export class UserHistoryRepository implements Repository<UserHistorySchema, CreateHistoryData, UpdateHistoryData> {

    async create(data: CreateHistoryData): Promise<UserHistorySchema> {
        const id = randomUUIDv7();
        const [entry] = await db`
            INSERT INTO user_history (id, user_id, song_id, part)
            VALUES (
                ${id},
                ${data.userId},
                ${data.songId},
                ${data.part}
            )
            RETURNING *
        `;
        if (!entry) throw new Error("Failed to create user history entry");
        return this.mapRow(entry);
    }

    async getById(id: string): Promise<UserHistorySchema> {
        const [entry] = await db`
            SELECT * FROM user_history WHERE id = ${id}
        `;
        if (!entry) throw new Error(`User history entry with id ${id} not found`);
        return this.mapRow(entry);
    }

    /** Returns full listen history for a given user, newest first. */
    async getByUserId(userId: string): Promise<UserHistorySchema[]> {
        const rows = await db`
            SELECT * FROM user_history WHERE user_id = ${userId} ORDER BY listened_at DESC
        `;
        return rows.map((row) => this.mapRow(row));
    }

    async getAll(): Promise<UserHistorySchema[]> {
        const rows = await db`SELECT * FROM user_history ORDER BY listened_at DESC`;
        return rows.map((row) => this.mapRow(row));
    }

    /** History entries are immutable — update is a no-op that returns the existing entry. */
    async update(id: string, _data: UpdateHistoryData): Promise<UserHistorySchema> {
        return this.getById(id);
    }

    async delete(id: string): Promise<UserHistorySchema> {
        const [entry] = await db`
            DELETE FROM user_history WHERE id = ${id} RETURNING *
        `;
        if (!entry) throw new Error(`User history entry with id ${id} not found`);
        return this.mapRow(entry);
    }

    // Maps DB snake_case row → camelCase UserHistorySchema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapRow(row: Record<string, any>): UserHistorySchema {
        return {
            id: row.id as string,
            userId: row.user_id as string,
            songId: row.song_id as string,
            part: row.part as number,
            listenedAt: (row.listened_at as Date)?.toISOString(),
        };
    }
}
