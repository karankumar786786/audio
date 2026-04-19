import { neon } from "@neondatabase/serverless";
import * as recombee from "recombee-api-client";
import * as dotenv from "dotenv";
import * as path from "node:path";

dotenv.config({ path: path.join(__dirname, ".env") });

const { ApiClient, requests } = recombee;

async function realign() {
  if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL is not set");
      return;
  }
  
  const sql = neon(process.env.DATABASE_URL);

  const region = process.env.RECOMBEE_DATABASE_REGION || "eu-west";
  console.log(`Initialising Recombee client in region: ${region}`);

  const recombeeClient = new ApiClient(
    process.env.RECOMBEE_DATABASE!,
    process.env.RECOMBEE_DATABASE_PRIVATE_TOKEN!,
    { region }
  );

  try {
    console.log("Fetching songs from Neon...");
    const songs = await sql`SELECT * FROM songs` as any[];
    console.log(`Found ${songs.length} songs to re-sync`);

    for (const song of songs) {
      const baseId = song.id.split(".")[0];
      console.log(`Syncing song: ${song.title} (${baseId})`);

      const properties = {
        fullId: song.id,
        jobId: song.job_id,
        createdAt: song.created_at ? new Date(song.created_at).toISOString() : new Date().toISOString(),
        title: song.title,
        artistName: song.artist_name,
        duration: song.duration / 1000, 
        songKey: song.song_key,
        imageKey: song.image_key,
        language: song.language || "unknown",
        loudness: 0,
        dynamicComplexity: 0,
        bpm: 0,
        spectralCentroid: 0,
        spectralFlux: 0,
        zeroCrossingRate: 0,
      };

      const req = new requests.SetItemValues(baseId, properties, {
        cascadeCreate: true
      });
      // Increase timeout to 30 seconds for bulk operations
      req.timeout = 30000;

      await recombeeClient.send(req);
    }

    console.log("Re-sync complete");
  } catch (err) {
    console.error("Error during re-sync:", err);
  }
}

realign();
