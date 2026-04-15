import type { Database } from "../infra/db";
import { userSchema, type UserSchema } from "../schema/user.schema";
import { BaseRepository } from "./base.repository";
import { logMethods, type Logger } from "../observability";
import type { SignatureService } from "../lib";

type CreateUserData = Pick<UserSchema,   "email">;
type UpdateUserData = Partial<CreateUserData>;

export class UserRepository extends BaseRepository<UserSchema, CreateUserData, UpdateUserData> {
    constructor(
        db: Database,
        logger: Logger,
        private readonly signatureService:SignatureService
    ) {
        super(db, "users", userSchema, logger);
        logMethods(this, this.logger);
    }

    async create(data: CreateUserData): Promise<UserSchema> {
        const id = this.signatureService.generateSignedId();
        const [user] = await this.db`
            INSERT INTO users (id, email)
            VALUES (${id}, ${data.email})
            ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
            RETURNING id, email, created_at AS "createdAt"
        `;
        if (!user) throw new Error("Failed to create user");
        return this.mapRow(user);
    }

    async update(id: string, data: UpdateUserData): Promise<UserSchema> {
        const [user] = await this.db`
            UPDATE users
            SET email = COALESCE(${data.email ?? null}, email)
            WHERE id = ${id}
            RETURNING id, email, created_at AS "createdAt"
        `;
        if (!user) throw new Error(`User with id ${id} not found`);
        return this.mapRow(user);
    }

    async getByEmail(email: string): Promise<UserSchema | null> {
        const [user] = await this.db`
            SELECT id, email, created_at AS "createdAt" FROM users WHERE email = ${email}
        `;
        return user ? this.mapRow(user) : null;
    }

    async getAll(): Promise<UserSchema[]> {
        const rows = await this.db`
            SELECT id, email, created_at AS "createdAt" FROM users ORDER BY created_at DESC
        `;
        return rows.map((row) => this.mapRow(row));
    }
}
