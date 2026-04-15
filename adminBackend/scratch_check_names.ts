import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
const sql = neon(connectionString);

async function checkData() {
    try {
        const artists = await sql`SELECT name FROM artists LIMIT 5`;
        const songs = await sql`SELECT DISTINCT artist_name FROM songs LIMIT 10`;
        console.log("Artists in DB:", artists.map(a => a.name));
        console.log("Artist names in Songs table:", songs.map(s => s.artist_name));
    } catch (err) {
        console.error("Failed to check data:", err);
    }
}

checkData();
