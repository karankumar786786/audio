import { config } from "dotenv";
import { searchService } from "../src/infra";

config();

(async () => {
    try {
        console.log("Configuring Algolia search settings...");

        await searchService.setSettings([
            "title",
            "artistName",
            "language",
            "name"
        ]);

        console.log("✅ Algolia search settings configured successfully");
    } catch (error) {
        console.error("❌ Failed to configure Algolia search settings:", error);
        process.exit(1);
    }
})();
