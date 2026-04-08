import { inngest, searchService, songProcessingJobRepository, logger } from "../infra";

export const indexAlgolia = inngest.createFunction(
    { id: "index-algolia", triggers: [{ event: "audio/song.index.algolia" }] as any },
    async ({ event, step }: any) => {
        const { jobId, songId } = event.data;
        logger.info(`[ALGOLIA] Received trigger for songId: ${songId}, jobId: ${jobId}`);
        
        // Fetch data
        const job = await step.run("fetch-job-meta", async () => {
            return await songProcessingJobRepository.getById(songId);
        });

        // Step 1: Sync with Algolia
        await step.run("sync-with-algolia", async () => {
            logger.info(`[INDEXING] Syncing song ${songId} (Job: ${jobId}) with Algolia`);
            await searchService.save({
                id: jobId,
                title: job.title,
                artistName: job.artistName,
                duration: job.duration || 0,
                songKey: job.songKey || "",
                imageKey: job.imageKey,
                language: job.language || "",
            });
            await songProcessingJobRepository.update(songId, { savedInSearch: true });
        });

        // Step 2: Trigger Final Record Creation
        await step.sendEvent("trigger-finalization", {
            name: "audio/song.final.create",
            data: { jobId, songId }
        });

        return { status: "success", jobId, songId };
    }
);
