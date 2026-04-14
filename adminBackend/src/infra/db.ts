import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export const db = neon(`${process.env.DATABASE_URL}`);
export type Database = NeonQueryFunction<false, false>;