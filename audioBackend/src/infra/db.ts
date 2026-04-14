import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export const db = neon(`${process.env.DATABASE_URL || ""}`);

if (!process.env.DATABASE_URL) {
    console.warn("WARNING: DATABASE_URL is not set. Database operations will fail.");
}

export type Database = NeonQueryFunction<false, false>;
