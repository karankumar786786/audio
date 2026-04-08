import { SarvamAIClient } from "sarvamai";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

export class TranscriptionService {
    private readonly logger: any;
    private readonly apiKey: string;
    private readonly client: SarvamAIClient;

    constructor(logger: any) {
        this.logger = logger;
        const apiKey = process.env.SARVAM_API_KEY;
        if (!apiKey) {
            throw new Error("SARVAM_API_KEY not found in environment variables");
        }
        this.apiKey = apiKey;
        this.client = new SarvamAIClient({
            apiSubscriptionKey: this.apiKey
        });
    }

    /**
     * Generates transcription for a given audio file and saves it to a specified JSON file path.
     *
     * @param audioFilePath - Absolute or relative path to the input audio file.
     * @param outputJsonFilePath - Absolute or relative path where the final JSON transcription should be saved.
     */
    async generateTranscribe(audioFilePath: string, outputJsonFilePath: string): Promise<{ languageCode: string }> {
        if (!fs.existsSync(audioFilePath)) {
            throw new Error(`Audio file not found: ${audioFilePath}`);
        }

        this.logger.info(`Processing audio file: ${audioFilePath}`);

        // Create batch job
        const job = await this.client.speechToTextJob.createJob({
            model: "saaras:v3",
            withDiarization: true,
        });

        this.logger.info(`Created job: ${job.jobId}`);

        // Upload and process files
        this.logger.info("Uploading file...");
        await job.uploadFiles([audioFilePath]);

        this.logger.info("Starting job...");
        await job.start();

        // Wait for completion
        this.logger.info("Waiting for job to complete (this may take a few minutes)...");
        await job.waitUntilComplete();

        // Check file-level results
        const fileResults = await job.getFileResults();
        const baseName = path.basename(audioFilePath);

        const failed = fileResults.failed.find((f: any) => f.file_name === baseName);
        if (failed) {
            throw new Error(`Failed to transcribe ${failed.file_name}: ${failed.error_message}`);
        }

        const successful = fileResults.successful.find((f: any) => f.file_name === baseName);
        if (!successful) {
            throw new Error("Job completed but file was not marked as successful or failed.");
        }

        // Download to a temporary directory
        const tempOutputDir = fs.mkdtempSync(path.join(os.tmpdir(), "sarvam-transcribe-"));

        try {
            await job.downloadOutputs(tempOutputDir);

            const downloadedFiles = fs.readdirSync(tempOutputDir);
            const jsonFile = downloadedFiles.find(f => f.endsWith('.json'));

            if (!jsonFile) {
                throw new Error(`No JSON output found in downloaded files. Downloaded: ${downloadedFiles.join(", ")}`);
            }

            const sourceJsonPath = path.join(tempOutputDir, jsonFile);

            // Extract the languageCode
            const transcriptionContent = fs.readFileSync(sourceJsonPath, "utf-8");
            const transcriptionData = JSON.parse(transcriptionContent);
            const languageCode = transcriptionData.language_code || "unknown";

            // Ensure the target directory exists
            const targetDir = path.dirname(outputJsonFilePath);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            // Copy the JSON to the requested output path
            fs.copyFileSync(sourceJsonPath, outputJsonFilePath);

            this.logger.info(`Transcription successfully saved to: ${outputJsonFilePath}`);

            return { languageCode };
        } finally {
            // Clean up the temporary directory
            fs.rmSync(tempOutputDir, { recursive: true, force: true });
        }
    }
}
