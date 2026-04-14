import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
export const db = neon(`${connectionString}`);
export type Database = NeonQueryFunction<false, false>;