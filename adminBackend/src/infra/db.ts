import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;

if (!connectionString || connectionString === "undefined") {
    console.warn("WARNING: DATABASE_URL is not set. Database operations will fail.");
}

export const db = neon(`${connectionString || ""}`);
export type Database = NeonQueryFunction<false, false>;