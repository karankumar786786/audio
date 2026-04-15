import { inngest, audioProcessingService } from "../infra";

export const indexRecombee = inngest.createFunction(
    { id: "index-recombee", triggers: [{ event: "audio/song.index.recombee" }] as any },
    async ({ event, step, logger }: any) => {
        const { jobId, songId } = event.data;
        
        await step.run("sync-with-recombee", async () => {
            await audioProcessingService.saveToRecommendation(songId, logger);
        });

        await step.sendEvent("trigger-algolia-indexing", {
            name: "audio/song.index.algolia",
            data: { jobId, songId }
        });

        return { status: "success", jobId, songId };
    }
);
