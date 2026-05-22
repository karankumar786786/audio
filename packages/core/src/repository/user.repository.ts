import { type DbClient } from "../db/db.ts";
import { userSchema, type UserSchema } from "../schema/user.schema.ts";
import { BaseRepository } from "./base.repository.ts";
import { logMethods, type Logger } from "../utils/index.ts";
import type { SignatureService } from "../infra/signature.types.ts";
import { users } from "../db/schema.ts";
import { eq, desc } from "drizzle-orm";

type CreateUserData = { email: string; name?: string | null; role?: "user" | "admin" | "superadmin" };
type UpdateUserData = Partial<CreateUserData>;

export class UserRepository extends BaseRepository<UserSchema, typeof users, CreateUserData, UpdateUserData> {
    constructor(
        db: DbClient,
        logger: Logger,
        private readonly signatureService: SignatureService
    ) {
        super(db, users, userSchema, logger);
        logMethods(this, this.logger);
    }

    async create(data: CreateUserData): Promise<UserSchema> {
        const id = this.signatureService.generateSignedId();
        const [row] = await this.db
            .insert(users)
            .values({ 
                id, 
                email: data.email,
                name: data.name || null,
                role: data.role || "user"
            })
            .onConflictDoUpdate({
                target: users.id,
                set: { 
                    email: data.email,
                    name: data.name || null,
                    role: data.role || "user"
                }
            })
            .returning();
        if (!row) throw new Error("Failed to create user");
        return this.mapRow(row);
    }

    async update(id: string, data: UpdateUserData): Promise<UserSchema> {
        const setClause: Partial<typeof users.$inferInsert> = {};
        if (data.email !== undefined) setClause.email = data.email;
        if (data.name !== undefined) setClause.name = data.name;
        if (data.role !== undefined) setClause.role = data.role;

        const [row] = await this.db
            .update(users)
            .set(setClause)
            .where(eq(users.id, id))
            .returning();
        if (!row) throw new Error(`User with id ${id} not found`);
        return this.mapRow(row);
    }

    async getByEmail(email: string): Promise<UserSchema | null> {
        const rows = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
        const row = rows[0];
        return row ? this.mapRow(row) : null;
    }

    async getAll(): Promise<UserSchema[]> {
        const rows = await this.db.select().from(users).orderBy(desc(users.createdAt));
        return rows.map((row) => this.mapRow(row));
    }
}
