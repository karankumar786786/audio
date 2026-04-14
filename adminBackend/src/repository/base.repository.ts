import type { Database } from "../infra/db";
import type { Repository } from "../types/repository.type";
import { type Logger } from "../observablity";
import { type ZodType } from "zod";
import { NotFoundError } from "../errors";

/**
 * Abstract Base Repository providing generic CRUD operations with Zod validation.
 * 
 * @template T - The Domain Model type (Zod inference)
 * @template CreateInput - Data required for creation
 * @template UpdateInput - Data required for update
 */
export abstract class BaseRepository<
    T,
    CreateInput = Omit<T, "id" | "createdAt" | "updatedAt">,
    UpdateInput = Partial<CreateInput>
> implements Repository<T, CreateInput, UpdateInput> {
    
    constructor(
        protected readonly db: Database,
        protected readonly tableName: string,
        protected readonly schema: ZodType<T, any, any>,
        protected readonly logger: Logger
    ) {}

    /**
     * Map a raw DB row to the domain schema using Zod.
     * This ensures 100% data integrity at the repository boundary.
     */
    protected mapRow(row: Record<string, any>): T {
        try {
            return this.schema.parse(row);
        } catch (error: any) {
            this.logger.error({ error: error.errors, row, tableName: this.tableName }, `[${this.tableName}] Zod validation failed for database row`);
            throw error;
        }
    }

    async getById(id: string): Promise<T> {
        // Neon driver (NeonQueryFunction) expects tagged template literals.
        // For generic table names, we bypass the type check as the table name is provided safely via constructor.
        const rows = await (this.db as any)(`SELECT * FROM ${this.tableName} WHERE id = $1`, [id]);
        const row = rows[0];

        if (!row) {
            throw new NotFoundError(`${this.tableName.slice(0, -1)} with id ${id} not found`);
        }
        return this.mapRow(row);
    }

    async count(): Promise<number> {
        const rows = await (this.db as any)(`SELECT count(*)::int as count FROM ${this.tableName}`);
        const row = rows[0];
        return row?.count || 0;
    }

    async delete(id: string): Promise<T> {
        const rows = await (this.db as any)(`DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`, [id]);
        const row = rows[0];

        if (!row) {
            throw new NotFoundError(`${this.tableName.slice(0, -1)} with id ${id} not found`);
        }
        return this.mapRow(row);
    }

    /**
     * Abstract methods that require specific SQL logic
     */
    abstract create(data: CreateInput): Promise<T>;
    abstract update(id: string, data: UpdateInput): Promise<T>;
    
    /**
     * Helper for paginated list queries
     */
    protected async getAllInternal(limit?: number, offset?: number, orderBy: string = "created_at"): Promise<T[]> {
        const sql = `SELECT * FROM ${this.tableName} ORDER BY ${orderBy} DESC LIMIT $1 OFFSET $2`;
        const rows = await (this.db as any)(sql, [limit ?? null, offset ?? null]);
        return rows.map((r: any) => this.mapRow(r));
    }
}
