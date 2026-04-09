import { config } from "dotenv";
config();

import { recommendationService } from "../../src/infra";

(async () => {
    try {
        console.log("🧹 Cleaning Recombee data (Reset + Re-init schema)...");
        await recommendationService.resetDatabase();
        
        console.log("⏳ Waiting for database erasure to complete...");
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            try {
                await recommendationService.setUp({} as any);
                console.log("✅ Recombee data cleaned/truncated successfully");
                break;
            } catch (error: any) {
                // Check if it is the "being erased" error (statusCode 422)
                if (error.statusCode === 422 || (error.message && error.message.includes("being erased"))) {
                    attempts++;
                    process.stdout.write(".");
                    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
                } else {
                    throw error;
                }
            }
        }
        
        if (attempts >= maxAttempts) {
            throw new Error("Timed out waiting for Recombee database erasure.");
        }
    } catch (error) {
        console.error("❌ Failed to clean Recombee:", error);
        process.exit(1);
    }
})();
