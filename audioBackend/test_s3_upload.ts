import { AudioTranscoder } from "./src/lib/transcode/index";
import { S3Service } from "./src/lib/storage/s3";
import { config } from "dotenv";

config();

async function run() {
    const region = process.env.REGION!;
    const accessKeyId = process.env.ACCESS_KEY_ID!;
    const secretAccessKey = process.env.SECRET_KEY!;
    const bucketName = process.env.TEMP_BUCKET_NAME!; 
    const basePath = process.env.BASE_PATH!;

    console.log("Initializing S3 with Region:", region, "Bucket:", bucketName);

    const s3Service = new S3Service(region, accessKeyId, secretAccessKey);
    const client = s3Service.getClient();

    // The name of the folder created in S3 will be the basename of outputDir.
    // So if outputDir is "./test_output_s3/song1", in S3 it will be <basePath>/song1
    const inputAudio = "./Main Agar Saamne   Raaz   Dino Morea   Bipasha Basu   Abhijeet & Alka Yagnik   Hindi Hit Songs.m4a";
    const outputDir = "./test_output_s3/Main_Agar_Saamne";
    
    const transcoder = new AudioTranscoder(
        4, // segmentTime
        client as any,
        bucketName,
        basePath
    );

    try {
        await transcoder.transcode(inputAudio, outputDir);
        console.log("Transcoding and S3 upload test successful!");
    } catch (e) {
        console.error("Test failed:", e);
    }
}
run();
