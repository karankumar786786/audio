import { inngest, logger, songProcessingJobRepository } from "../infra";

export const processExtractedFeatures = inngest.createFunction(
    { id: "process-extracted-features", triggers: [{ event: "audio/song.features.extracted" }] as any },
    async ({ event, step }: any) => {
        const { jobId, songId, features } = event.data;
        logger.info(`[FEATURES] Received callback for songId: ${songId}, jobId: ${jobId}`);
        
        await step.run("update-job-metadata", async () => {
            logger.info(`[FEATURES] Saving extracted features to DB for song ${songId} (Job: ${jobId})`);
            await songProcessingJobRepository.update(songId, {
                duration: features.duration,
                sampleRate: features.sample_rate,
                loudness: features.loudness,
                dynamicComplexity: features.dynamic_complexity,
                bpm: features.bpm,
                spectralCentroid: features.spectral_centroid,
                spectralFlux: features.spectral_flux,
                zeroCrossingRate: features.zero_crossing_rate,
                extractedFeatures: true
            });
        });

        // Trigger Recombee Indexing
        await step.sendEvent("trigger-recombee", {
            name: "audio/song.index.recombee",
            data: { jobId, songId }
        });

        return { status: "success", jobId, songId };
    }
);
