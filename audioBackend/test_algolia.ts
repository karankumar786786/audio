import { AlgoliaService } from "./src/lib/search";
import { config } from "dotenv";

config();

const appId = process.env.APP_ID!;
const apiKey = process.env.API_KEY!;
const algoliaService = new AlgoliaService(appId, apiKey, "audios");

async function checkAlgolia() {
  console.log("Checking Algolia...");
  try {
    const hits = await algoliaService.search("");
    console.log(`Found ${hits.length} items in 'audios' index.`);
    console.log(JSON.stringify(hits, null, 2));
  } catch (error) {
    console.error("Algolia search failed:", error);
  }
}

checkAlgolia();
