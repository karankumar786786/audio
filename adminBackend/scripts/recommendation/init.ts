import { config } from "dotenv";
config();

import { recommendationService } from "../../../audioBackend/src/infra";

(async () => {
    try {
        console.log("🚀 Initializing Recombee schema...");
        await recommendationService.setUp({} as any);
        console.log("✅ Recombee schema configured successfully");
    } catch (error) {
        console.error("❌ Failed to initialize Recombee:", error);
        process.exit(1);
    }
})();
