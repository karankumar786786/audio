import { SarvamAIClient } from "sarvamai";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {languageMapper} from "./langugaeMapper.utils";

export class TranscriptionService {
    private readonly logger: any;
    private readonly apiKey: string;
    private readonly client: SarvamAIClient;
    private readonly s3Client: S3Client;

    constructor(
        logger: any,
        apiKey: string,
        s3Client: S3Client
    ) {
        this.logger = logger;
        this.apiKey = apiKey;
        this.client = new SarvamAIClient({
            apiSubscriptionKey: this.apiKey
        });
        this.s3Client = s3Client;
    }

    /**
     * Generates transcription for a given audio file and uploads it to S3.
     *
     * @param audioFilePath - Absolute or relative path to the input audio file.
     * @param bucketName    - The S3 bucket to upload to.
     * @param key           - The S3 key (path) to save the JSON to.
     */
    async generateTranscribe(audioFilePath: string, bucketName: string, key: string): Promise<{ language: string }> {
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
        this.logger.info("Uploading file to Sarvam AI...");
        await job.uploadFiles([audioFilePath]);

        this.logger.info("Starting Sarvam AI job...");
        await job.start();

        // Wait for completion
        this.logger.info("Waiting for transcription job to complete...");
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

        // Download to a temporary directory to extract content
        const tempOutputDir = fs.mkdtempSync(path.join(os.tmpdir(), "sarvam-transcribe-"));

        try {
            await job.downloadOutputs(tempOutputDir);

            const downloadedFiles = fs.readdirSync(tempOutputDir);
            const jsonFile = downloadedFiles.find(f => f.endsWith('.json'));

            if (!jsonFile) {
                throw new Error(`No JSON output found in downloaded files. Downloaded: ${downloadedFiles.join(", ")}`);
            }

            const sourceJsonPath = path.join(tempOutputDir, jsonFile);

            // Extract the languageCode and full content
            const transcriptionContent = fs.readFileSync(sourceJsonPath, "utf-8");
            const transcriptionData = JSON.parse(transcriptionContent);
            const languageCode = transcriptionData.language_code || "unknown";

            // Upload the JSON directly to S3
            this.logger.info(`   ☁️  Uploading transcription JSON to s3://${bucketName}/${key}`);
            await this.s3Client.send(new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: transcriptionContent,
                ContentType: "application/json",
                CacheControl: "no-transform",
            }));

            this.logger.info(`   ✅ Transcription successfully saved to S3`);
            return { language:languageMapper.getName(languageCode) };
        } finally {
            // Clean up the temporary directory
            fs.rmSync(tempOutputDir, { recursive: true, force: true });
        }
    }
}
