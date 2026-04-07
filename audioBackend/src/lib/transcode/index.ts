import * as path from "node:path";
import * as fs from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import chokidar, { FSWatcher } from "chokidar";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import pLimit from "p-limit";
import { generateTranscribe } from "../transcribeAudio/generateTranscribe";

const execFileAsync = promisify(execFile);

// ── Audio Quality Profile ─────────────────────────────────────────────────────

export interface AudioQualityProfile {
    label: string;
    bitrate: string;    // e.g. "64k"
    sampleRate: number; // Hz, e.g. 44100
    channels: number;   // 1 = mono, 2 = stereo
    bandwidth: number;  // bits/s declared in HLS/DASH manifests
}

/** Multi-bitrate AAC profiles used for audio transcoding. */
export const AUDIO_QUALITY_PROFILES: AudioQualityProfile[] = [
    { label: "64kbps",  bitrate: "64k",  sampleRate: 44100, channels: 2, bandwidth: 64000 },
    { label: "128kbps", bitrate: "128k", sampleRate: 44100, channels: 2, bandwidth: 128000 },
    { label: "320kbps", bitrate: "320k", sampleRate: 44100, channels: 2, bandwidth: 320000 },
];

// Derived from awaitWriteFinish.stabilityThreshold + buffer — must stay in sync
const WATCHER_CLOSE_DELAY_MS = 1500;

// ── Audio Transcoder ──────────────────────────────────────────────────────────

/**
 * Transcodes any audio file (mp3, wav, flac, ogg, aac, m4a …) to
 * 64 kbps AAC, packages it for both HLS and DASH streaming, generates
 * a WebVTT caption file via Whisper, and uploads everything to S3.
 *
 * S3 output layout:
 *   <basePath>/
 *   └── <audioName>/
 *       ├── master.m3u8       ← HLS master playlist
 *       ├── master.mpd        ← DASH manifest
 *       ├── caption.json      ← JSON transcription (Sarvam AI)
 *       └── audio/
 *           ├── 64kbps/
 *           │   ├── init.mp4
 *           │   ├── audio_00001.m4s
 *           │   └── playlist.m3u8
 *           ├── 128kbps/
 *           │   ├── init.mp4
 *           │   ├── audio_00001.m4s
 *           │   └── playlist.m3u8
 *           └── 320kbps/
 *               ├── init.mp4
 *               ├── audio_00001.m4s
 *               └── playlist.m3u8
 */
export class AudioTranscoder {

    private readonly segmentTime: number;
    private readonly client: S3Client;
    private readonly bucketName: string;
    private readonly basePath: string;
    private readonly pendingUploads = new Set<Promise<void>>();
    private readonly limit = pLimit(5);

    constructor(
        segmentTime: number = 4,
        client: S3Client,
        bucketName: string,
        basePath: string,
    ) {
        this.segmentTime = segmentTime;
        this.client = client;
        this.bucketName = bucketName;
        this.basePath = basePath;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    async transcode(inputAudio: string, outputDir: string): Promise<void> {
        console.log(`\n--- Starting Audio Transcoding Process ---`);
        console.log(`Input:  ${inputAudio}`);
        console.log(`Output: ${outputDir}\n`);

        fs.mkdirSync(outputDir, { recursive: true });

        const duration = await this.getAudioDuration(inputAudio);
        if (duration <= 0) throw new Error("Invalid audio duration, cannot transcode");

        console.log(`📏 Duration: ${duration.toFixed(2)}s — segment size: ${this.segmentTime}s\n`);

        const audioName = path.basename(outputDir);

        // Watch outputDir and stream new files to S3 as they appear
        const watcher = this.watchAndUpload(outputDir, audioName);

        // STEP 1 — Transcode input → multi-bitrate AACs
        const audioDir = path.join(outputDir, "audio");
        fs.mkdirSync(audioDir, { recursive: true });
        const rawAudioPaths = await this.transcodeAudio(inputAudio, audioDir);

        // STEP 2 — Generate JSON transcription via Sarvam AI (non-fatal)
        await this.generateCaptions(inputAudio, outputDir);

        // STEP 3 — Package → master.m3u8 + master.mpd
        await this.runShakaPackager(outputDir, rawAudioPaths);

        // STEP 4 — Flush watcher, wait for all in-flight uploads
        await this.closeWatcher(watcher);

        console.log(`\n--- Audio Transcoding Completed ---`);
        console.log(`Outputs: ${outputDir}\n`);
    }

    // ── Private — Probing ─────────────────────────────────────────────────────

    private async getAudioDuration(audioPath: string): Promise<number> {
        if (!fs.existsSync(audioPath)) {
            throw new Error(`File does not exist at path: ${audioPath}`);
        }

        const { stdout, stderr } = await execFileAsync("ffprobe", [
            "-v", "error",
            "-print_format", "json",
            "-show_format",
            audioPath,
        ]);

        if (stderr) console.warn("ffprobe warning:", stderr);

        const data = JSON.parse(stdout);
        const duration = parseFloat(data.format?.duration ?? "0");

        if (duration === 0) {
            console.error("ffprobe returned 0 duration. Output:", stdout);
        }

        return duration;
    }

    // ── Private — Transcoding ─────────────────────────────────────────────────

    /**
     * Re-encodes the input audio to multiple AAC profiles.
     * Strips any embedded cover art or video stream (-vn).
     * @returns Array of paths to the raw transcoded outputs.
     */
    private async transcodeAudio(inputAudio: string, audioDir: string): Promise<string[]> {
        const rawPaths: string[] = [];

        for (const profile of AUDIO_QUALITY_PROFILES) {
            const outPath = path.join(audioDir, `raw_audio_${profile.label}.m4a`);
            console.log(`   🎵 Transcoding audio → ${profile.bitrate} AAC...`);

            const args = [
                "-y",
                "-loglevel", "warning",
                "-i", inputAudio,
                "-vn",                          // drop cover-art / video track
                "-c:a", "aac",
                "-b:a", profile.bitrate,
                "-ar", profile.sampleRate.toString(),
                "-ac", profile.channels.toString(),
                "-movflags", "+faststart",      // moov atom at front for streaming
                outPath,
            ];

            try {
                await execFileAsync("ffmpeg", args);
                console.log(`   ✅ Audio transcoded → ${path.basename(outPath)}`);
                rawPaths.push(outPath);
            } catch (err: any) {
                console.error(`   ❌ Failed to transcode audio:`, err.message ?? err);
                throw err;
            }
        }
        return rawPaths;
    }

    /**
     * Calls the `generateTranscribe` function to generate a JSON transcription file from the audio.
     * The resulting file is predictably named so the client can always locate it.
     *
     * Failure is NON-FATAL — a warning is logged and transcoding continues.
     */
    private async generateCaptions(inputAudio: string, outputDir: string): Promise<void> {
        console.log(`   📝 Generating transcription with Sarvam AI...`);

        // Emit at the same level as master files
        const jsonOut = path.join(outputDir, "caption.json");

        try {
            await generateTranscribe(inputAudio, jsonOut);
            console.log(`   ✅ Transcription saved → caption.json`);
        } catch (err: any) {
            // Transcription generation is optional — never fail the pipeline over it
            console.warn(`   ⚠️  Transcription generation skipped (${err.message ?? err})`);
        }
    }

    // ── Private — Shaka Packager ──────────────────────────────────────────────

    /**
     * Runs Shaka Packager on the raw audio files, producing:
     *   - CMAF/fMP4 segments  (audio/<quality>/*.m4s + audio/<quality>/init.mp4)
     *   - HLS playlist        (audio/<quality>/playlist.m3u8)
     *   - HLS master playlist (master.m3u8)
     *   - DASH manifest       (master.mpd)
     */
    private async runShakaPackager(outputDir: string, rawAudioPaths: string[]): Promise<void> {
        console.log(`   📦 Packaging with Shaka Packager...`);

        const toShaka = (p: string) => p.replace(/\\/g, "/");
        const audioDir = path.join(outputDir, "audio");

        // Build stream descriptors for each audio profile
        const streamDescriptors = rawAudioPaths.map((rawPath, i) => {
            const profile = AUDIO_QUALITY_PROFILES[i]!;
            const profileDir = path.join(audioDir, profile.label);
            fs.mkdirSync(profileDir, { recursive: true });

            return [
                `in=${toShaka(rawPath)}`,
                `stream=audio`,
                `init_segment=${toShaka(path.join(profileDir, "init.mp4"))}`,
                `segment_template=${toShaka(path.join(profileDir, "audio_$Number%05d$.m4s"))}`,
                `playlist_name=${toShaka(path.join(profileDir, "playlist.m3u8"))}`,
                `hls_group_id=audio`,
                `hls_name=${profile.label}`,
                `bandwidth=${profile.bandwidth}`,
            ].join(",");
        });

        const args: string[] = [
            ...streamDescriptors,

            // ── Global flags ─────────────────────────────────────────────────
            "--mpd_output",                 toShaka(path.join(outputDir, "master.mpd")),
            "--hls_master_playlist_output", toShaka(path.join(outputDir, "master.m3u8")),
            "--segment_duration",           this.segmentTime.toString(),

            // Forces type="static" VOD MPD
            "--generate_static_live_mpd",

            // SegmentTemplate@duration instead of SegmentTimeline
            "--segment_template_constant_duration",

            // Prevents the last short segment from breaking @duration
            "--allow_approximate_segment_timeline",
        ];

        try {
            await execFileAsync("packager", args);
            await this.patchMpdForVod(path.join(outputDir, "master.mpd"));
            console.log(`   ✅ Packaging complete`);
        } catch (err: any) {
            console.error(`   ❌ Packaging failed:`, err.message ?? err);
            throw err;
        }
    }

    /** Strips live-stream attributes from the MPD so it plays as VOD. */
    private async patchMpdForVod(mpdPath: string): Promise<void> {
        let content = fs.readFileSync(mpdPath, "utf-8");

        content = content.replace(/\btype="dynamic"/, 'type="static"');
        content = content.replace(/\s*minimumUpdatePeriod="[^"]*"/, "");
        content = content.replace(/\s*availabilityStartTime="[^"]*"/, "");
        content = content.replace(/\s*timeShiftBufferDepth="[^"]*"/, "");
        content = content.replace(/\s*suggestedPresentationDelay="[^"]*"/, "");

        if (!content.includes("mediaPresentationDuration")) {
            const periodDuration = content.match(/\bPeriod[^>]+\bduration="([^"]+)"/)?.[1];
            if (periodDuration) {
                content = content.replace(
                    /<MPD /,
                    `<MPD mediaPresentationDuration="${periodDuration}" `
                );
            }
        }

        fs.writeFileSync(mpdPath, content, "utf-8");
        console.log(`   ✅ MPD patched for VOD`);
    }

    // ── Private — S3 upload ───────────────────────────────────────────────────

    /**
     * Watches outputDir with chokidar and uploads every new/changed file to S3.
     * The intermediate raw_audio.m4a is excluded from uploads.
     */
    private watchAndUpload(outputDir: string, audioName: string): FSWatcher {
        const watcher = chokidar.watch(outputDir, {
            persistent: true,
            ignoreInitial: false,           // upload files that already exist
            ignored: /raw_audio_.*\.m4a$/,  // skip the intermediate transcoded files
            awaitWriteFinish: {
                stabilityThreshold: 500,    // wait 500ms of silence before firing
                pollInterval: 100,
            },
        });

        watcher.on("add",    (fp) => this.scheduleUpload(fp, outputDir, audioName));
        watcher.on("change", (fp) => this.scheduleUpload(fp, outputDir, audioName));
        watcher.on("error",  (err) => console.error("🔴 Watcher error:", err));

        console.log(`👁  Watching ${outputDir} for S3 uploads...`);
        return watcher;
    }

    private scheduleUpload(filePath: string, outputDir: string, audioName: string): void {
        const p = this.limit(() => this.uploadFileToS3(filePath, outputDir, audioName))
            .finally(() => this.pendingUploads.delete(p));
        this.pendingUploads.add(p);
    }

    private async uploadFileToS3(
        filePath: string,
        outputDir: string,
        audioName: string,
        maxRetries = 10,
    ): Promise<void> {
        const relPath     = path.relative(outputDir, filePath);
        const s3Key       = `${this.basePath}/${audioName}/${relPath}`.replace(/\\/g, "/");
        const contentType = this.resolveContentType(filePath);

        for (let i = 0; i < maxRetries; i++) {
            try {
                const body = fs.readFileSync(filePath);

                await this.client.send(new PutObjectCommand({
                    Bucket: this.bucketName,
                    Key: s3Key,
                    Body: body,
                    ContentType: contentType,
                    CacheControl: "no-transform",
                }));

                console.log(`   ☁️  Uploaded → s3://${this.bucketName}/${s3Key}`);
                return;
            } catch (err: any) {
                console.warn(`   ⚠️  Upload attempt ${i + 1} failed for ${relPath}: ${err.message}`);
                if (i < maxRetries - 1) {
                    await new Promise(r => setTimeout(r, 1000 * (i + 1)));
                } else {
                    console.error(`   ❌ Final upload failure for ${filePath}:`, err.message ?? err);
                }
            }
        }
    }

    private resolveContentType(filePath: string): string {
        const ext = path.extname(filePath).toLowerCase();
        const map: Record<string, string> = {
            ".m3u8": "application/vnd.apple.mpegurl",
            ".mpd":  "application/dash+xml",
            ".mp4":  "audio/mp4",           // init.mp4
            ".m4s":  "audio/mp4",           // CMAF audio segments
            ".m4a":  "audio/mp4",
            ".vtt":  "text/vtt",            // WebVTT captions
            ".json": "application/json",    // JSON transcription
        };
        return map[ext] ?? "application/octet-stream";
    }

    private closeWatcher(watcher: FSWatcher): Promise<void> {
        return new Promise((resolve) => {
            // Delay must exceed awaitWriteFinish.stabilityThreshold (500ms)
            setTimeout(() => {
                watcher.close().then(async () => {
                    console.log("👁  Watcher closed — waiting for in-flight uploads...");
                    if (this.pendingUploads.size > 0) {
                        await Promise.allSettled([...this.pendingUploads]);
                    }
                    console.log("☁️  All uploads settled");
                    resolve();
                });
            }, WATCHER_CLOSE_DELAY_MS);
        });
    }
}