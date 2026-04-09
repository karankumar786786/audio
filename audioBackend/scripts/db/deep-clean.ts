import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config();

const sql = neon(`${process.env.DATABASE_URL}`);

(async () => {
    try {
        console.log("💣 Dropping all database tables (DEEP CLEAN)...");

        await sql`DROP TABLE IF EXISTS user_history CASCADE;`;
        await sql`DROP TABLE IF EXISTS user_search_history CASCADE;`;
        await sql`DROP TABLE IF EXISTS user_favourite_songs CASCADE;`;
        await sql`DROP TABLE IF EXISTS user_playlist_songs CASCADE;`;
        await sql`DROP TABLE IF EXISTS user_playlists CASCADE;`;
        await sql`DROP TABLE IF EXISTS system_playlist_songs CASCADE;`;
        await sql`DROP TABLE IF EXISTS system_playlists CASCADE;`;
        await sql`DROP TABLE IF EXISTS artists CASCADE;`;
        await sql`DROP TABLE IF EXISTS songs CASCADE;`;
        await sql`DROP TABLE IF EXISTS song_processing_job CASCADE;`;

        console.log("✅ All tables dropped successfully");
    } catch (err) {
        console.error("❌ Error dropping tables:", err);
        process.exit(1);
    }
})();
