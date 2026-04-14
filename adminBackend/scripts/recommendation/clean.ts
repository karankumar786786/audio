import { config } from "dotenv";
config();

import { recommendationService } from "../../../audioBackend/src/infra";
import { sleepSync } from "bun";

(async () => {
    try {
        console.log("🧹 Cleaning Recombee data (Reset + Re-init schema)...");
        try {
            await recommendationService.resetDatabase();
        } catch (error: any) {
            if (error.statusCode === 422 || (error.message && error.message.includes("being erased"))) {
                console.log("ℹ️ Database erasure already in progress, skipping reset request...");
            } else {
                throw error;
            }
        }

        console.log("⏳ Waiting for database erasure to complete (this can take several minutes)...");
        let attempts = 0;
        const maxAttempts = 60; // Increased to 60 attempts (5 minutes total)

        while (attempts < maxAttempts) {
            try {
                // Try to set up schema. If it fails with 422, it means erasure is still going.
                await recommendationService.setUp({} as any);
                console.log("\n✅ Recombee data cleaned/truncated successfully");
                break;
            } catch (error: any) {
                // Check if it is the "being erased" error (statusCode 422)
                if (error.statusCode === 422 || (error.message && error.message.includes("being erased"))) {
                    attempts++;
                    process.stdout.write(".");
                    if (attempts % 10 === 0) process.stdout.write(` (${attempts * 5}s) `);
                    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds
                } else {
                    throw error;
                }
            }
        }

        if (attempts >= maxAttempts) {
            throw new Error("\n❌ Timed out waiting for Recombee database erasure (exceeded 5 minutes). Please try running the script again in a moment.");
        }
    } catch (error) {
        console.error("❌ Failed to clean Recombee:", error);
        process.exit(1);
    }
})();
