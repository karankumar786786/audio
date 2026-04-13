import * as path from "node:path";
import * as fs from "node:fs";
import { inngest, transcodingService, songProcessingJobRepository, logger, storageService } from "../infra";

const TEMP_BUCKET = process.env.TEMP_BUCKET_NAME || "videotranscodetemp";

export const transcodeSong = inngest.createFunction(
    { id: "transcode-song", triggers: { event: "audio/song.transcode" } as any },
    async ({ event, step }: any) => {
        const { songId, jobId } = event.data;
        const job = await step.run("fetch-job", async () => {
            return await songProcessingJobRepository.getById(songId);
        });
        const baseTmpDir = path.join(process.cwd(), "tmp");
        if (!fs.existsSync(baseTmpDir)) {
            fs.mkdirSync(baseTmpDir, { recursive: true });
        }
        const localDownloadPath = path.join(baseTmpDir, `${path.basename(songId)}`);
        const timestamp = Date.now();
        const outputDir = path.join(baseTmpDir, `t_${songId}`);
        try {
            await step.run("download-from-s3", async () => {
                logger.info(`[TRANSCODE] Downloading raw audio for job ${jobId}`);
                await storageService.downloadObject(TEMP_BUCKET, job.tempSongKey, localDownloadPath);
                await songProcessingJobRepository.update(songId, { status: "processing" });
            });

            // Step 2: Transcode
            const audioName = await step.run("transcode-audio", async () => {
                logger.info(`[TRANSCODE] Starting transcoding for job ${jobId}`);
                await transcodingService.transcode(localDownloadPath, outputDir);
                const name = path.basename(outputDir);
                await songProcessingJobRepository.update(songId, { 
                    transcodingAttempt: 1,
                    transcodingId: name,
                    transcoded: true
                });
                return name;
            });
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
            await songProcessingJobRepository.update(songId, { status: "failed" });
            throw error;
        } finally {
            // Cleanup local files
            if (fs.existsSync(localDownloadPath)) fs.unlinkSync(localDownloadPath);
            if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
        }
    }
);
