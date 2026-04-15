import { inngest, audioProcessingService } from "../infra";

export const transcribeSong = inngest.createFunction(
    { id: "transcribe-song", triggers: [{ event: "audio/song.transcribe" }] as any },
    async ({ event, step, logger }: any) => {
        const { songId, jobId, audioName } = event.data;
        
        try {
            const { language } = await step.run("transcription-process", async () => {
                return await audioProcessingService.transcribe(songId, jobId, audioName, logger);
            });

            // Trigger the next step (Python feature extraction)
            const job = await step.run("fetch-job", async () => {
                return await audioProcessingService.getJob(songId);
            });

            const payload = {
                jobId,
                songId,
                key: job.tempSongKey,
                bucket: process.env.TEMP_BUCKET_NAME || "videotranscodetemp"
            };

            logger.info("[TRANSCRIBE] Triggering Python with payload", payload);
            await step.sendEvent("trigger-python-extraction", {
                name: "audio/song.features.extract",
                data: payload
            });

            return { status: "success", language };
        } catch (error: any) {
            logger.error(`[TRANSCRIBE] Job ${jobId} failed:`, error);
            await audioProcessingService.updateJobStatus(songId, "failed");
            throw error;
        }
    }
);
