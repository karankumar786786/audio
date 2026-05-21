import { createDb } from "@onemelody/core";

export const db = createDb(process.env.DATABASE_URL || "postgresql://mock:mock@localhost:5432/mock");

