import { db } from "./src/infra";
import { config } from "dotenv";
config();

async function checkHistory() {
    console.log("🔍 Checking Database History Records...");
    
    try {
        const users = await db`SELECT id, email FROM users LIMIT 5`;
        console.log("Users in DB:", users);

        const historyCount = await db`SELECT count(*) FROM user_history`;
        console.log("Total History Records:", historyCount);

        const historySamples = await db`
            SELECT id, user_id, song_id, part, listened_at 
            FROM user_history 
            ORDER BY listened_at DESC 
            LIMIT 10
        `;
        console.log("Recent History Samples:", historySamples);

        const songs = await db`SELECT id, title FROM songs LIMIT 5`;
        console.log("Songs in DB:", songs);

    } catch (error) {
        console.error("❌ DB Query Error:", error);
    }
}

checkHistory().catch(console.error);
