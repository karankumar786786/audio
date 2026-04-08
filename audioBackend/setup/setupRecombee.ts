import { config } from "dotenv";
config();

import { recommendationService } from "../src/infra";

(async () => {
    try {
        console.log("Configuring Recombee item properties...");

        // RecommendationServiceImpl.setUp takes a schema object for reference
        // but uses the internal SCHEMA_FIELDS map to perform the setup.
        await recommendationService.setUp({} as any);

        console.log("✅ Recombee item properties configured successfully");
    } catch (error) {
        console.error("❌ Failed to configure Recombee item properties:", error);
        process.exit(1);
    }
})();
