import { config } from "dotenv";
config();

import { searchService } from "../../src/infra";

(async () => {
    try {
        console.log("🚀 Initializing Algolia search settings...");

        await searchService.setSettings([
            "title",
            "artistName",
            "language",
            "name"
        ]);

        console.log("✅ Algolia search settings configured successfully");
    } catch (error) {
        console.error("❌ Failed to initialize Algolia:", error);
        process.exit(1);
    }
})();
