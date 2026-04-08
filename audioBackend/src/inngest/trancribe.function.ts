import * as path from "node:path";
import * as fs from "node:fs";
import { inngest, transcriptionService, logger, songProcessingJobRepository, storageService } from "../infra";

const TEMP_BUCKET = process.env.TEMP_BUCKET_NAME || "videotranscodetemp";
const PROD_BUCKET = process.env.PRODUCTION_BUCKET_NAME || "videotranscodeprod";

export const transcribeSong = inngest.createFunction(
    { id: "transcribe-song", triggers: [{ event: "audio/song.transcribe" }] as any },
    async ({ event, step }: any) => {
        const { songId, jobId, audioName } = event.data;
        
        // Fetch fresh data
        const job = await step.run("fetch-job", async () => {
            return await songProcessingJobRepository.getById(songId);
        });

        const baseTmpDir = path.join(process.cwd(), "tmp");
        if (!fs.existsSync(baseTmpDir)) {
            fs.mkdirSync(baseTmpDir, { recursive: true });
        }

        const localDownloadPath = path.join(baseTmpDir, `${path.basename(songId)}_transcribe`);
        const prodSongKey = `${process.env.BASE_PATH || "audios"}/${audioName}`;

        try {
            // Step 1: Download
            await step.run("download-raw-audio", async () => {
                logger.info(`[TRANSCRIBE] Downloading audio for transcription: ${jobId}`);
                await storageService.downloadObject(TEMP_BUCKET, job.tempSongKey, localDownloadPath);
            });

            // Step 2: Transcribe
            const { language } = await step.run("generate-transcription", async () => {
                const captionPath = `${prodSongKey}/caption.json`;
                logger.info(`[TRANSCRIBE] Generating transcription for job ${jobId}`);
                
                const result = await transcriptionService.generateTranscribe(
                    localDownloadPath, 
                    PROD_BUCKET, 
                    captionPath
                );
                
                await songProcessingJobRepository.update(songId, { 
                    transcribingAttempt: 1,
                    transcribingId: captionPath,
                    transcribed: true,
                    language: result.language,
                    songKey: prodSongKey
                });
                
                return { language: result.language };
            });

            // Step 3: Trigger Python Service (Feature Extraction)
            const payload = {
                jobId,
                songId,
                key: job.tempSongKey,
                bucket: TEMP_BUCKET
            };
            logger.info("[TRANSCRIBE] Triggering Python with payload", payload);
            await step.sendEvent("trigger-python-extraction", {
                name: "audio/song.features.extract",
                data: payload
            });

            return { status: "success", language };

        } catch (error: any) {
            logger.error(`[TRANSCRIBE] Job ${jobId} failed:`, error);
            await songProcessingJobRepository.update(songId, { status: "failed" });
            throw error;
        } finally {
            if (fs.existsSync(localDownloadPath)) {
                fs.unlinkSync(localDownloadPath);
            }
        }
    }
);
