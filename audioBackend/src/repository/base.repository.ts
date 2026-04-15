import type { Database } from "../infra/db";
import type { Repository } from "../type/repository.type";
import { type Logger } from "../observability";
import { type ZodType } from "zod";
import { NotFoundError } from "../errors";

import { toCamelCase } from "../lib/mapper";

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
            // Automatically convert database snake_case to camelCase
            const camelCaseRow = toCamelCase<Record<string, any>>(row);
            return this.schema.parse(camelCaseRow);
        } catch (error: any) {
            this.logger.error({ error: error.errors, row: toCamelCase<Record<string, any>>(row), tableName: this.tableName }, `[${this.tableName}] Zod validation failed for database row`);
            throw error;
        }
    }

    async getById(id: string): Promise<T> {
        // Neon driver (NeonQueryFunction) expects tagged template literals.
        // For generic table names, we bypass the type check as the table name is provided safely via constructor.
        const rows = await (this.db as any)(`SELECT * FROM ${this.tableName} WHERE id = $1`, [id]);
        const row = rows[0];

        if (!row) {
            const entityName = this.tableName.endsWith('s') ? this.tableName.slice(0, -1) : this.tableName;
            throw new NotFoundError(`${entityName} with id ${id} not found`);
        }
        return this.mapRow(row);
    }

    async count(query?: string): Promise<number> {
        const sql = query 
            ? `SELECT count(*)::int as count FROM ${this.tableName} WHERE name ILIKE $1`
            : `SELECT count(*)::int as count FROM ${this.tableName}`;
        
        const rows = await (this.db as any)(sql, query ? [`%${query}%`] : []);
        return rows[0]?.count || 0;
    }

    async delete(id: string): Promise<T> {
        const rows = await (this.db as any)(`DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`, [id]);
        const row = rows[0];

        if (!row) {
            const entityName = this.tableName.endsWith('s') ? this.tableName.slice(0, -1) : this.tableName;
            throw new NotFoundError(`${entityName} with id ${id} not found`);
        }
        return this.mapRow(row);
    }

    /**
     * Abstract methods that require specific SQL logic
     */
    abstract create(data: CreateInput): Promise<T>;
    abstract update(id: string, data: UpdateInput): Promise<T>;
}
