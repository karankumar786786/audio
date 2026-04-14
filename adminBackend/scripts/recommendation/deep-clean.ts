import { config } from "dotenv";
config();

import { recommendationService } from "../../../audioBackend/src/infra";

(async () => {
    try {
        console.log("💣 Resetting Recombee database (DEEP CLEAN)...");
        await recommendationService.resetDatabase();
        console.log("✅ Recombee database reset successfully");
    } catch (error) {
        console.error("❌ Failed to reset Recombee:", error);
        process.exit(1);
    }
})();
