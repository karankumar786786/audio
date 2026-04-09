import { config } from "dotenv";
config();

import { searchService } from "../../src/infra";

(async () => {
    try {
        console.log("🧹 Clearing Algolia index records...");
        await searchService.clearIndex();
        console.log("✅ Algolia index cleared successfully");
    } catch (error) {
        console.error("❌ Failed to clear Algolia index:", error);
        process.exit(1);
    }
})();
