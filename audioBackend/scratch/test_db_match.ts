import { db, signatureService, logger } from "../src/infra";
import { SongRepository } from "../src/repository/song.repository";

async function verify() {
  const songRepository = new SongRepository(db, logger, signatureService);
  const baseIds = ["e6a6e7ec84f84064b2a2340c254b3aea"];
  console.log(`[Test] Looking for base IDs: ${baseIds}`);
  
  const songs = await songRepository.getByBaseIds(baseIds);
  console.log(`[Test] Found ${songs.length} songs.`);
  
  if (songs.length > 0) {
    console.log("[Test] SUCCESS! Found song:");
    console.log(`- Title: ${songs[0].title}`);
    console.log(`- Full ID: ${songs[0].id}`);
  } else {
    console.error("[Test] FAILED! No match found.");
  }
  process.exit(0);
}

verify();
