import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config();

const sql = neon(`${process.env.DATABASE_URL}`);

(async () => {
    try {
        console.log(process.env.DATABASE_URL)
        // 🎵 SONGS
        await sql`DROP TABLE IF EXISTS user_history CASCADE;`;
        await sql`DROP TABLE IF EXISTS user_search_history CASCADE;`;
        await sql`DROP TABLE IF EXISTS user_favourite_songs CASCADE;`;
        await sql`DROP TABLE IF EXISTS user_playlist_songs CASCADE;`;
        await sql`DROP TABLE IF EXISTS user_playlists CASCADE;`;
        await sql`DROP TABLE IF EXISTS system_playlist_songs CASCADE;`;
        await sql`DROP TABLE IF EXISTS system_playlists CASCADE;`;
        await sql`DROP TABLE IF EXISTS artists CASCADE;`;
        await sql`DROP TABLE IF EXISTS songs CASCADE;`;



        console.log("✅ All tables created successfully");
    } catch (err) {
        console.error("❌ Error creating tables:", err);
    }
})();