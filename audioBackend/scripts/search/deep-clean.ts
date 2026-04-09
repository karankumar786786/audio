import { config } from "dotenv";
config();

import { searchService } from "../../src/infra";

(async () => {
    try {
        console.log("💣 Deleting Algolia index (DEEP CLEAN)...");
        await searchService.deleteIndex();
        console.log("✅ Algolia index deleted successfully");
    } catch (error) {
        console.error("❌ Failed to delete Algolia index:", error);
        process.exit(1);
    }
})();
