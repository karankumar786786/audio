import { inngest, audioProcessingService } from "../infra";

export const transcodeSong = inngest.createFunction(
    { id: "transcode-song", triggers: { event: "audio/song.transcode" } as any },
    async ({ event, step, logger }: any) => {
        const { songId, jobId } = event.data;
        
        try {
            // Orchestrate the transcoding process via the service
            const { audioName } = await step.run("transcode-process", async () => {
                return await audioProcessingService.transcode(songId, jobId, logger);
            });

            // Trigger the next step in the pipeline
            await step.sendEvent("trigger-transcription", {
                name: "audio/song.transcribe",
                data: {
                    songId,
                    jobId,
                    audioName
                }
            });

            return { status: "success", audioName };
        } catch (error: any) {
            logger.error(`[TRANSCODE] Job ${jobId} failed:`, error);
            await audioProcessingService.updateJobStatus(songId, "failed");
            throw error;
        }
    }
);
