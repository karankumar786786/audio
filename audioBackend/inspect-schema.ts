import { db } from "./src/infra/db";

async function inspectSchema() {
    console.log("Checking user_favourite_songs columns...");
    try {
        const columns = await db`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user_favourite_songs'
        `;
        console.log("Columns:", columns);
    } catch (e) {
        console.error("Error inspecting schema:", e);
    }
}

inspectSchema().catch(console.error);
