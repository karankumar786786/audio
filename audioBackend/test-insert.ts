import { db, interactionService, userService } from "./src/infra";
import { config } from "dotenv";
config();

async function testInsert() {
    console.log("🧪 Attempting Manual History Insert via Services...");
    
    try {
        const users = await db`SELECT id FROM users LIMIT 1`;
        const songs = await db`SELECT id FROM songs LIMIT 1`;
        
        if (users.length === 0 || songs.length === 0) {
            console.error("No user or song found to test with");
            return;
        }

        const userId = users[0].id;
        const songId = songs[0].id;

        console.log(`Using user: ${userId}`);
        console.log(`Using song: ${songId}`);

        await interactionService.recordListen(userId, songId, 85);
        console.log("✅ recordListen call finished");

        const historyResponse = await userService.getHistory(userId, 10, 0);
        console.log("🔍 Fetch back results:", historyResponse);
        console.log("Songs data length:", historyResponse.data.length);

    } catch (error) {
        console.error("❌ Test Insert Failed:", error);
    }
}

testInsert().catch(console.error);
