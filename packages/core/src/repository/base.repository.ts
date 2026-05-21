import { type DbClient } from "../db/db.ts";
import { type ZodType } from "zod";
import { NotFoundError } from "../errors/index.ts";
import { eq, sql } from "drizzle-orm";

export abstract class BaseRepository<
  T,
  TableType extends Record<string, any>,
  CreateInput = Omit<T, "id" | "createdAt" | "updatedAt">,
  UpdateInput = Partial<CreateInput>
> {
  constructor(
    protected readonly db: DbClient,
    protected readonly table: TableType,
    protected readonly schema: ZodType<T, any, any>,
    protected readonly logger: any
  ) {}

  protected mapRow(row: any): T {
    try {
      return this.schema.parse(row);
    } catch (error: any) {
      const tableName = (this.table as any)?.tableName || "entity";
      this.logger.error({ error: error.errors, row, tableName }, `[${tableName}] Zod validation failed for database row`);
      throw error;
    }
  }

  async getById(id: string): Promise<T> {
    const rows = await this.db.select().from(this.table).where(eq(this.table.id, id)).limit(1);
    const row = rows[0];
    if (!row) {
      const tableName = (this.table as any)?.tableName || "entity";
      const entityName = tableName.endsWith('s') ? tableName.slice(0, -1) : tableName;
      throw new NotFoundError(`${entityName} with id ${id} not found`);
    }
    return this.mapRow(row);
  }

  async count(): Promise<number> {
    const res = await this.db.select({ count: sql<number>`count(*)::int` }).from(this.table);
    return res[0]?.count || 0;
  }

  async delete(id: string): Promise<T> {
    const rows = await this.db.delete(this.table).where(eq(this.table.id, id)).returning();
    const row = rows[0];
    if (!row) {
      const tableName = (this.table as any)?.tableName || "entity";
      const entityName = tableName.endsWith('s') ? tableName.slice(0, -1) : tableName;
      throw new NotFoundError(`${entityName} with id ${id} not found`);
    }
    return this.mapRow(row);
  }

  abstract create(data: CreateInput): Promise<T>;
  abstract update(id: string, data: UpdateInput): Promise<T>;
}
export type Repository<T, CreateInput = Omit<T, "id" | "createdAt" | "updatedAt">, UpdateInput = Partial<CreateInput>> = {
  getById(id: string): Promise<T>;
  count(): Promise<number>;
  delete(id: string): Promise<T>;
  create(data: CreateInput): Promise<T>;
  update(id: string, data: UpdateInput): Promise<T>;
};
