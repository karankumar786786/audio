import { db, interactionService, userService, signatureService } from "./src/infra";
import { config } from "dotenv";
config();

async function testWithValidSignature() {
    console.log("🧪 Testing with VALID Signature...");
    
    try {
        // 1. Create a dummy user with the NEW secret
        const email = `test-${Date.now()}@example.com`;
        const user = await userService.createUser("dummy-token-will-fail-but-we-just-need-id-gen");
        // Actually createUser calls Auth0. We can't do that easily here.
        // Let's use userRepository directly.
    } catch (e) {
        console.log("UserService.createUser failed (expected), proceding with direct repo access...");
    }

    try {
        const userId = signatureService.generateSignedId();
        const songId = signatureService.generateSignedId();

        console.log(`Generated Dummy Signed User ID: ${userId}`);
        console.log(`Generated Dummy Signed Song ID: ${songId}`);

        // We need these to actually exist in DB for foreign key constraints
        // Let's insert a dummy user and song
        await db`INSERT INTO users (id, email) VALUES (${userId}, ${`test-${Date.now()}@gmail.com`})`;
        await db`INSERT INTO songs (id, title, artist_name, duration, song_key, image_key, language, job_id) 
                 VALUES (${songId}, 'Test Song', 'Test Artist', 300, 'key', 'img', 'english', 'test-job')`;

        console.log("Inserted dummy user and song.");

        await interactionService.recordListen(userId, songId, 50);
        console.log("✅ recordListen successful with valid signatures!");

        const history = await userService.getHistory(userId);
        console.log("🔍 History fetched:", history.data.length, "items");

    } catch (error) {
        console.error("❌ Test Failed:", error);
    } finally {
        // Clean up
        // process.exit();
    }
}

testWithValidSignature().catch(console.error);
