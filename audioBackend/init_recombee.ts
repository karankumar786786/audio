import { ApiClient, requests } from "recombee-api-client";
import { config } from "dotenv";

config();

const client = new ApiClient(
  process.env.RECOMBEE_DATABASE!,
  process.env.RECOMBEE_DATABASE_PRIVATE_TOKEN!,
  { region: process.env.RECOMBEE_DATABASE_REGION || "eu-west" }
);

const SCHEMA: Record<string, "string" | "int" | "double"> = {
  s3Key: "string",
  duration: "double",
  loudness: "double",
  dynamicComplexity: "double",
  bpm: "double",
  spectralCentroid: "double",
  spectralFlux: "double",
  zeroCrossingRate: "double",
};

async function setup() {
  console.log("Setting up Recombee schema...");

  for (const [key, type] of Object.entries(SCHEMA)) {
    try {
      await client.send(new requests.AddItemProperty(key, type));
      console.log(`✅ Added: ${key} (${type})`);
    } catch (e: any) {
      if (e.message?.includes("already exists")) {
        console.log(`ℹ️  Already exists: ${key}`);
      } else {
        console.error(`❌ Failed: ${key}:`, e.message);
      }
    }
  }
}

setup();