import type { Database } from "../infra/db";
import type { UserSchema } from "../schema/user.schema";
import { logMethods, type Logger } from "../observability";

type CreateUserData = Pick<UserSchema, "id" | "email">;

export class UserRepository {
    constructor(
        private readonly db: Database,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    async create(data: CreateUserData): Promise<UserSchema> {
        const [row] = await this.db`
            INSERT INTO users (id, email)
            VALUES (${data.id}, ${data.email})
            ON CONFLICT (id) DO UPDATE
                SET email = EXCLUDED.email
            RETURNING *
        `;
        if (!row) throw new Error("Failed to create user");
        return this.mapRow(row);
    }

    async getById(id: string): Promise<UserSchema | null> {
        const [row] = await this.db`
            SELECT * FROM users WHERE id = ${id}
        `;
        return row ? this.mapRow(row) : null;
    }

    async getByEmail(email: string): Promise<UserSchema | null> {
        const [row] = await this.db`
            SELECT * FROM users WHERE email = ${email}
        `;
        return row ? this.mapRow(row) : null;
    }

    async getAll(): Promise<UserSchema[]> {
        const rows = await this.db`SELECT * FROM users ORDER BY created_at DESC`;
        return rows.map((row) => this.mapRow(row));
    }

    async delete(id: string): Promise<UserSchema> {
        const [row] = await this.db`
            DELETE FROM users WHERE id = ${id} RETURNING *
        `;
        if (!row) throw new Error(`User with id ${id} not found`);
        return this.mapRow(row);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapRow(row: Record<string, any>): UserSchema {
        return {
            id: row.id as string,
            email: row.email as string,
            createdAt: (row.created_at as Date)?.toISOString(),
        };
    }
}
