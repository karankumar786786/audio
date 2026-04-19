import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(__dirname, "../.env") });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
    console.log("Updating database constraint...");
    try {
        await sql`
            ALTER TABLE song_processing_job 
            DROP CONSTRAINT IF EXISTS song_processing_job_status_check;
        `;
        
        await sql`
            ALTER TABLE song_processing_job 
            ADD CONSTRAINT song_processing_job_status_check 
            CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'importing'));
        `;
        console.log("Constraint updated successfully!");
    } catch (error) {
        console.error("Failed to update constraint:", error);
    }
}

main();
