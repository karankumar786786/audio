import { inngest, audioProcessingService } from "../infra";

export const finalizeSong = inngest.createFunction(
    { id: "finalize-song", triggers: [{ event: "audio/song.final.create" }] as any },
    async ({ event, step, logger }: any) => {
        const { jobId, songId } = event.data;
        
        await step.run("finalize-process", async () => {
            await audioProcessingService.finalize(songId, logger);
        });

        return { status: "success", jobId, songId };
    }
);
