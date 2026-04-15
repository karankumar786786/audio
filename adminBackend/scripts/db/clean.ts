import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config();

const sql = neon(`${process.env.DATABASE_URL}`);

(async () => {
    try {
        console.log("🧹 Truncating all database tables...");

        await sql`TRUNCATE TABLE user_history CASCADE;`;
        await sql`TRUNCATE TABLE user_search_history CASCADE;`;
        await sql`TRUNCATE TABLE user_favourite_songs CASCADE;`;
        await sql`TRUNCATE TABLE user_playlist_songs CASCADE;`;
        await sql`TRUNCATE TABLE user_playlists CASCADE;`;
        await sql`TRUNCATE TABLE playlist_songs CASCADE;`;
        await sql`TRUNCATE TABLE playlists CASCADE;`;
        await sql`TRUNCATE TABLE artists CASCADE;`;
        await sql`TRUNCATE TABLE songs CASCADE;`;
        await sql`TRUNCATE TABLE song_processing_job CASCADE;`;

        console.log("✅ All tables truncated successfully");
    } catch (err) {
        console.error("❌ Error truncating tables:", err);
        process.exit(1);
    }
})();
