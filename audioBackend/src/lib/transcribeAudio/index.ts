import { AssemblyAI } from "assemblyai";
import * as fs from "node:fs";
import * as path from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { languageMapper } from "./langugaeMapper.utils";

export class TranscriptionService {
    private readonly logger: any;
    private readonly apiKey: string;
    private readonly client: AssemblyAI;
    private readonly s3Client: S3Client;

    constructor(
        logger: any,
        apiKey: string,
        s3Client: S3Client
    ) {
        this.logger = logger;
        this.apiKey = apiKey || "b5f508b5ede84051a24dd5d904916629";
        this.client = new AssemblyAI({
            apiKey: this.apiKey
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

        this.logger.info(`Processing audio file with AssemblyAI: ${audioFilePath}`);

        try {
            // Request parameters as suggested by the user
            const transcript = await this.client.transcripts.transcribe({
                audio: audioFilePath, // Local file path is supported by the SDK
                speech_models: ["universal-2"],
                speaker_labels: true,
                format_text: true,
                punctuate: true,
                language_detection: true,
            });

            if (transcript.status === "error") {
                throw new Error(`AssemblyAI Transcription failed: ${transcript.error}`);
            }

            this.logger.info(`Transcription completed. Status: ${transcript.status}`);

            const languageCode = transcript.language_code || "unknown";
            const transcriptionContent = JSON.stringify(transcript, null, 2);

            // Upload the full transcript JSON to S3
            this.logger.info(`   ☁️  Uploading AssemblyAI transcript JSON to s3://${bucketName}/${key}`);
            await this.s3Client.send(new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: transcriptionContent,
                ContentType: "application/json",
                CacheControl: "no-transform",
            }));

            this.logger.info(`   ✅ Transcription successfully saved to S3`);
            
            // Map the detected language code to its name
            const languageName = languageMapper.getName(languageCode);
            return { language: languageName };

        } catch (error: any) {
            this.logger.error(`Transcription process failed: ${error.message}`);
            throw error;
        }
    }
}
