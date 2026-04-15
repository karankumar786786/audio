import { inngest, audioProcessingService } from "../infra";

export const indexAlgolia = inngest.createFunction(
    { id: "index-algolia", triggers: [{ event: "audio/song.index.algolia" }] as any },
    async ({ event, step, logger }: any) => {
        const { jobId, songId } = event.data;
        
        await step.run("sync-with-algolia", async () => {
            await audioProcessingService.saveToSearch(songId, logger);
        });

        await step.sendEvent("trigger-finalization", {
            name: "audio/song.final.create",
            data: { jobId, songId }
        });

        return { status: "success", jobId, songId };
    }
);
