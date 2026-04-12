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

            // Generate and upload VTT subtitles with Karaoke word-level tags
            const words = transcript.words;
            let vttContent = "WEBVTT\n\n";
            
            if (Array.isArray(words) && words.length > 0) {
                const formatVttTime = (ms: number) => {
                    const date = new Date(ms);
                    const hh = String(Math.floor(ms / 3600000)).padStart(2, '0');
                    const mm = String(date.getUTCMinutes()).padStart(2, '0');
                    const ss = String(date.getUTCSeconds()).padStart(2, '0');
                    const mmm = String(date.getUTCMilliseconds()).padStart(3, '0');
                    return `${hh}:${mm}:${ss}.${mmm}`;
                };

                let currentChunkWords: any[] = [];
                const chunks: any[] = [];

                for (let i = 0; i < words.length; i++) {
                    const w = words[i];
                    if (!w) continue;
                    
                    if (currentChunkWords.length === 0) {
                        currentChunkWords.push(w);
                    } else {
                        const lastWord = currentChunkWords[currentChunkWords.length - 1];
                        const gap = w.start - lastWord.end;
                        if (gap > 800 || currentChunkWords.length >= 12) {
                            chunks.push([...currentChunkWords]);
                            currentChunkWords = [w];
                        } else {
                            currentChunkWords.push(w);
                        }
                    }
                }
                if (currentChunkWords.length > 0) {
                    chunks.push([...currentChunkWords]);
                }

                chunks.forEach((chunk: any[], idx: number) => {
                    const startTime = formatVttTime(chunk[0].start);
                    let baseEndMs = chunk[chunk.length - 1].end;
                    const nextChunkStartMs = chunks[idx + 1] ? chunks[idx + 1][0].start : Infinity;
                    
                    // Add tail, but strictly prevent overlapping with the next line!
                    let finalEndMs = baseEndMs + 2000;
                    if (finalEndMs > nextChunkStartMs) {
                        finalEndMs = nextChunkStartMs;
                    }
                    const endTime = formatVttTime(finalEndMs);
                    
                    vttContent += `${startTime} --> ${endTime}\n`;
                    
                    // Karaoke formatted line: <00:00:22.220>तू <00:00:22.600>मेरी ...
                    const line = chunk.map((w: any) => `<${formatVttTime(w.start)}>${w.text}`).join(' ');
                    vttContent += line + '\n\n';
                });
            } else {
                // fallback to native if no words
                vttContent = await this.client.transcripts.subtitles(transcript.id, "vtt");
            }

            const vttKey = key.replace('.json', '.vtt');

            this.logger.info(`   ☁️  Uploading AssemblyAI transcript VTT to s3://${bucketName}/${vttKey}`);
            await this.s3Client.send(new PutObjectCommand({
                Bucket: bucketName,
                Key: vttKey,
                Body: vttContent,
                ContentType: "text/vtt",
                CacheControl: "no-transform",
            }));

            this.logger.info(`   ✅ Transcription successfully saved to S3 (JSON and VTT)`);
            
            // Map the detected language code to its name
            const languageName = languageMapper.getName(languageCode);
            return { language: languageName };

        } catch (error: any) {
            this.logger.error(`Transcription process failed: ${error.message}`);
            throw error;
        }
    }
}
