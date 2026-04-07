import { AudioTranscoder } from "./src/lib/transcode/index";
import { S3Service } from "./src/lib/storage/s3";
import { config } from "dotenv";
import * as path from "path";
import * as fs from "fs";

config();

async function run() {
    const region = process.env.REGION!;
    const accessKeyId = process.env.ACCESS_KEY_ID!;
    const secretAccessKey = process.env.SECRET_KEY!;
    
    // Configurable buckets
    const tempBucketName = process.env.TEMP_BUCKET_NAME || "videotranscodetemp"; 
    const prodBucketName = process.env.PROD_BUCKET_NAME || "videotranscodeprod"; 
    const basePath = process.env.BASE_PATH || "audios";

    // 1. You pass the S3 key as an argument, or use a default one
    const tempS3Key = "Guru Randhawa - SIRRA ( Official Video ).m4a";

    console.log(`Initializing S3 (Region: ${region})`);

    const s3Service = new S3Service(region, accessKeyId, secretAccessKey);
    const client = s3Service.getClient();

    // Setup local paths
    const localAudioPath = `./temp_downloads/${path.basename(tempS3Key)}`;
    const outputDir = `./test_output_s3/${path.parse(tempS3Key).name}`;

    try {
        // 2. Download from Temporary Bucket
        console.log(`\n⬇️ Downloading s3://${tempBucketName}/${tempS3Key} to ${localAudioPath}...`);
        await s3Service.downloadObject(tempBucketName, tempS3Key, localAudioPath, (progress) => {
            process.stdout.write(`\rDownloading: ${progress}%`);
        });
        console.log("\n✅ Download complete!");

        // 3. Transcribe, Transcode, and Upload via AudioTranscoder
        // The AudioTranscoder watcher automatically streams the files (including caption.json) to the Production bucket
        console.log(`\n🎬 Starting transcoding pipeline (Target: s3://${prodBucketName}/${basePath})`);
        const transcoder = new AudioTranscoder(
            4, // segmentTime
            client as any,
            prodBucketName,
            basePath
        );

        await transcoder.transcode(localAudioPath, outputDir);
        console.log("\n✅ Transcoding, Transcription, and Production S3 upload completely successful!");

        // 4. Local Cleanup
        console.log("\n🧹 Cleaning up local files...");
        fs.rmSync(localAudioPath, { force: true });
        
        // Sometimes you may want to keep the directory to inspect
        // but as per the request, we completely wipe out the local files
        fs.rmSync(outputDir, { recursive: true, force: true });
        console.log("✅ Local cleanup complete!");

    } catch (e) {
        console.error("\n❌ Pipeline failed:", e);
    }
}

run();
