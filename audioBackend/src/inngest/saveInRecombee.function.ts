import { inngest, recommendationService, songProcessingJobRepository, logger } from "../infra";

export const indexRecombee = inngest.createFunction(
    { id: "index-recombee", triggers: [{ event: "audio/song.index.recombee" }] as any },
    async ({ event, step }: any) => {
        const { jobId, songId } = event.data;
        logger.info(`[RECOMBEE] Received trigger for songId: ${songId}, jobId: ${jobId}`);
        
        // Fetch data
        const job = await step.run("fetch-job-data", async () => {
            return await songProcessingJobRepository.getById(songId);
        });

        // Step 1: Sync with Recombee
        await step.run("sync-with-recombee", async () => {
            logger.info(`[INDEXING] Syncing song ${songId} (Job: ${jobId}) with Recombee`);
            await recommendationService.create({
                id: jobId, // Recommendation service might still use the public jobId
                title: job.title,
                artistName: job.artistName,
                duration: job.duration || 0,
                songKey: job.songKey || "",
                imageKey: job.imageKey,
                language: job.language || "",
                bpm: job.bpm || 0,
                loudness: job.loudness || 0,
                dynamicComplexity: job.dynamicComplexity || 0,
                spectralCentroid: job.spectralCentroid || 0,
                spectralFlux: job.spectralFlux || 0,
                zeroCrossingRate: job.zeroCrossingRate || 0,
            });
            await songProcessingJobRepository.update(songId, { savedInRecommendation: true });
        });

        // Step 2: Trigger Algolia
        await step.sendEvent("trigger-algolia-indexing", {
            name: "audio/song.index.algolia",
            data: { jobId, songId }
        });

        return { status: "success", jobId, songId };
    }
);
