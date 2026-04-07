import { db } from "../infra/db";
import { type UserSchema } from "../schema/user.schema";
import type { Repository } from "../type/repository.type";
import { randomUUIDv7 } from "bun";

// UserSchema only has username & email — no id or createdAt on the schema itself
type CreateUserData = UserSchema;
type UpdateUserData = Partial<CreateUserData>;

// We extend Repository with explicit generics because UserSchema has no id/createdAt fields
export class UserRepository implements Repository<UserSchema & { id: string; createdAt: string }, CreateUserData, UpdateUserData> {

    async create(data: CreateUserData): Promise<UserSchema & { id: string; createdAt: string }> {
        const id = randomUUIDv7();
        const [user] = await db`
            INSERT INTO users (id, username, email)
            VALUES (
                ${id},
                ${data.username},
                ${data.email}
            )
            RETURNING *
        `;
        if (!user) throw new Error("Failed to create user");
        return this.mapRow(user);
    }

    async getById(id: string): Promise<UserSchema & { id: string; createdAt: string }> {
        const [user] = await db`
            SELECT * FROM users WHERE id = ${id}
        `;
        if (!user) throw new Error(`User with id ${id} not found`);
        return this.mapRow(user);
    }

    async getAll(): Promise<(UserSchema & { id: string; createdAt: string })[]> {
        const users = await db`SELECT * FROM users ORDER BY created_at DESC`;
        return users.map((row) => this.mapRow(row));
    }

    async update(id: string, data: UpdateUserData): Promise<UserSchema & { id: string; createdAt: string }> {
        const [user] = await db`
            UPDATE users
            SET
                username = COALESCE(${data.username ?? null}, username),
                email    = COALESCE(${data.email ?? null}, email)
            WHERE id = ${id}
            RETURNING *
        `;
        if (!user) throw new Error(`User with id ${id} not found`);
        return this.mapRow(user);
    }

    async delete(id: string): Promise<UserSchema & { id: string; createdAt: string }> {
        const [user] = await db`
            DELETE FROM users WHERE id = ${id} RETURNING *
        `;
        if (!user) throw new Error(`User with id ${id} not found`);
        return this.mapRow(user);
    }

    // Maps DB snake_case row → camelCase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapRow(row: Record<string, any>): UserSchema & { id: string; createdAt: string } {
        return {
            id: row.id as string,
            username: row.username as string,
            email: row.email as string,
            createdAt: (row.created_at as Date)?.toISOString(),
        };
    }
}
