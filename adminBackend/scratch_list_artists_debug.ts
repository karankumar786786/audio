import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
const sql = neon(connectionString);

async function inspectArtists() {
    try {
        const rows = await sql`SELECT id, name FROM artists`;
        console.table(rows);
    } catch (err) {
        console.error(err);
    }
}

inspectArtists();
