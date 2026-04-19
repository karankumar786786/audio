import { db, recommendationService } from "../src/infra";
import { logger } from "../src/observability";

async function cleanAndSync() {
  try {
    logger.info("[Reclean] Resetting Recombee Database...");
    await recommendationService.resetDatabase();
    
    // Recombee takes some time to fully reset
    await new Promise(r => setTimeout(r, 10000));

    logger.info("[Reclean] Re-creating Schema Properties...");
    try {
      await recommendationService.setUp({
        id: "dummy",
        title: "dummy",
        artistName: "dummy",
        duration: 0,
        songKey: "dummy",
        imageKey: "dummy",
        language: "en",
        loudness: 0,
        dynamicComplexity: 0,
        bpm: 0,
        spectralCentroid: 0,
        spectralFlux: 0,
        zeroCrossingRate: 0
      });
    } catch (e) {
      logger.warn("[Reclean] Schema setup warning (might already exist):", e);
    }

    logger.info("[Reclean] Starting Fresh Sync...");
    
    const songs = await db`
      SELECT 
        s.id, s.title, s.artist_name AS "artistName", s.duration, 
        s.song_key AS "songKey", s.image_key AS "imageKey", s.language,
        spj.loudness, spj.dynamic_complexity AS "dynamicComplexity", spj.bpm,
        spj.spectral_centroid AS "spectralCentroid", spj.spectral_flux AS "spectralFlux",
        spj.zero_crossing_rate AS "zeroCrossingRate"
      FROM songs s
      LEFT JOIN song_processing_jobs spj ON s.job_id = spj.id
    `;

    logger.info(`[Reclean] Syncing ${songs.length} songs...`);

    for (const song of songs) {
      logger.info(`[Reclean] Processing: ${song.title}`);
      
      // recommendationService.create now internally uses stripId, 
      // so even passing song.id will result in a clean Base ID in Recombee.
      await recommendationService.create({
        id: song.id,
        title: (song.title as string) || "Unknown",
        artistName: (song.artistName as string) || "Unknown Artist",
        duration: Number(song.duration) || 0,
        songKey: (song.songKey as string) || "",
        imageKey: (song.imageKey as string) || "",
        language: (song.language as string) || "en",
        loudness: Number(song.loudness) || 0,
        dynamicComplexity: Number(song.dynamicComplexity) || 0,
        bpm: Number(song.bpm) || 0,
        spectralCentroid: Number(song.spectralCentroid) || 0,
        spectralFlux: Number(song.spectralFlux) || 0,
        zeroCrossingRate: Number(song.zeroCrossingRate) || 0
      });
    }

    logger.info("[Reclean] SUCCESS! Recombee is now clean and synced.");
    process.exit(0);
  } catch (err) {
    logger.error("[Reclean] FAILED:", err);
    process.exit(1);
  }
}

cleanAndSync();
