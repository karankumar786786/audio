import { inngest, songRepository, songProcessingJobRepository, logger, storageService } from "../infra";
import type { SongProcessingJob } from "../schema";

export const finalizeSong = inngest.createFunction(
    { id: "finalize-song", triggers: [{ event: "audio/song.final.create" }] as any },
    async ({ event, step }: any) => {
        const { jobId, songId } = event.data;
        logger.info(`[FINALIZE] Received trigger for songId: ${songId}, jobId: ${jobId}`);
        
        // Fetch final state from job record
        const job:SongProcessingJob = await step.run("fetch-final-job-data", async () => {
            return await songProcessingJobRepository.getById(songId);
        });
        // Step 1: Create the actual song record in the library
        await step.run("create-permanent-song-record", async () => {
            logger.info(`[FINALIZE] Creating permanent library record for song ${songId} (Job: ${jobId})`);
            
            await songRepository.create({
                id: songId,
                jobId: job.jobId, // The public/signed ID
                title: job.title,
                artistName: job.artistName,
                duration: Math.floor((job.duration || 0) * 1000), // convert to ms
                songKey: job.songKey || "",
                imageKey: job.imageKey,
                language: job.language || "",
            });
            
            // Step 2: Mark job as terminal success
            await songProcessingJobRepository.update(songId, { status: "completed" });
            logger.info(`[PIPELINE] Song ${songId} successfully finished.`);
        });

        await step.run("clear temp bucket", async () => {
            await storageService.deleteObject(process.env.TEMP_BUCKET_NAME!,job.tempSongKey);
        });
        return { status: "success", jobId, songId };
    }
);
