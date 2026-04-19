import { db, recommendationService } from "../src/infra";
import { logger } from "../src/observability";

async function sync() {
  try {
    logger.info("[Sync] Starting Recombee Catalogue Sync...");
    
    // 1. Fetch all songs
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

    logger.info(`[Sync] Found ${songs.length} songs to sync.`);

    for (const song of songs) {
      logger.info(`[Sync] Processing: ${song.title} (${song.id})`);
      
      // Map to RecommendationSchema
      // Note: We use the full ID here, the service's stripId will handle the cleaning.
      await recommendationService.create({
        id: (song.id as string) || "",
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

    logger.info("[Sync] Successfully synchronized all songs to Recombee.");
    process.exit(0);
  } catch (err) {
    logger.error("[Sync] Critical failure during sync:", err);
    process.exit(1);
  }
}

sync();
