import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema.ts";

export function createDb(databaseUrl: string) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to initialize Drizzle client");
  }
  const client = neon(databaseUrl);
  return drizzle(client, { schema });
}

export type DbClient = ReturnType<typeof createDb>;
