import { AudioTranscoder } from "./src/lib/transcode/index";
import { S3Service } from "./src/lib/storage/s3";
import { RecombeeService } from ".";
import { AlgoliaService } from "./src/lib/search";
import { config } from "dotenv";
import * as path from "path";
import * as fs from "fs";

config();

const FEATURE_API_URL = process.env.FEATURE_API_URL || "http://localhost:8000";

interface PipelineInput {
  key: string;
  itemId?: string;
}

interface PipelineResult {
  key: string;
  itemId: string;
  prodS3Path: string;
  recombeeItemId: string;
}

function log(step: string, msg: string) {
  console.log(`[${step}] ${msg}`);
}

function safeRm(p: string) {
  try {
    if (fs.existsSync(p)) {
      const stat = fs.statSync(p);
      stat.isDirectory()
        ? fs.rmSync(p, { recursive: true, force: true })
        : fs.rmSync(p, { force: true });
    }
  } catch {
    // best-effort cleanup
  }
}

interface AudioFeatures {
  key: string;
  duration: number;
  sample_rate: number;
  loudness: number;
  dynamic_complexity: number;
  bpm: number;
  spectral_centroid: number;
  spectral_flux: number;
  zero_crossing_rate: number;
}

async function extractFeatures(
  prodBucket: string,
  s3Key: string
): Promise<AudioFeatures> {
  log("FEATURES", `Calling FastAPI for s3://${prodBucket}/${s3Key}`);

  const res = await fetch(FEATURE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: s3Key, bucket: prodBucket }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Feature API responded ${res.status}: ${detail}`);
  }

  return res.json() as Promise<AudioFeatures>;
}

async function saveToRecombee(
  recombee: RecombeeService,
  itemId: string,
  features: AudioFeatures,
  s3Key: string
): Promise<void> {
  log("RECOMBEE", `Saving item ${itemId}`);
  await recombee.save({
    itemId,
    s3Key,
    duration: features.duration,
    loudness: features.loudness,
    dynamicComplexity: features.dynamic_complexity,
    bpm: features.bpm,
    spectralCentroid: features.spectral_centroid,
    spectralFlux: features.spectral_flux,
    zeroCrossingRate: features.zero_crossing_rate,
  });
}

export async function runAudioPipeline(
  input: PipelineInput
): Promise<PipelineResult> {
  const region = process.env.REGION!;
  const accessKeyId = process.env.ACCESS_KEY_ID!;
  const secretAccessKey = process.env.SECRET_KEY!;
  const tempBucket = process.env.TEMP_BUCKET_NAME || "videotranscodetemp";
  const prodBucket = process.env.PROD_BUCKET_NAME || "videotranscodeprod";
  const basePath = process.env.BASE_PATH || "audios";

  const recombeeDatabaseId = process.env.RECOMBEE_DATABASE!;
  const recombeeToken = process.env.RECOMBEE_DATABASE_PRIVATE_TOKEN!;
  const recombeeRegion = process.env.RECOMBEE_DATABASE_REGION || "eu-west";

  const algoliaAppId = process.env.APP_ID!;
  const algoliaApiKey = process.env.API_KEY!;

  const safeItemId = input.itemId || input.key.replace(/[^a-zA-Z0-9_\-]/g, "-");
  const { key, itemId = safeItemId } = input;
  const filename = path.basename(key);
  const baseName = path.parse(filename).name;

  const localAudioPath = path.join("./temp_downloads", filename);
  const outputDir = path.join("./temp_output", baseName);
  const prodS3Key = `${basePath}/${baseName}`;

  const s3Service = new S3Service(region, accessKeyId, secretAccessKey);
  const s3Client = s3Service.getClient();

  const recombeeService = new RecombeeService(
    recombeeDatabaseId,
    recombeeToken,
    recombeeRegion
  );

  const algoliaService = new AlgoliaService(algoliaAppId, algoliaApiKey, "audios");

  try {
    // 1. Download from temp bucket
    log("DOWNLOAD", `s3://${tempBucket}/${key} → ${localAudioPath}`);
    fs.mkdirSync("./temp_downloads", { recursive: true });

    await s3Service.downloadObject(tempBucket, key, localAudioPath, (pct) => {
      process.stdout.write(`\r  Downloading… ${pct}%`);
    });
    console.log("\n  ✓ Download complete");

    // 2. Transcode + upload to prod
    log("TRANSCODE", `Starting pipeline → s3://${prodBucket}/${basePath}`);
    fs.mkdirSync(outputDir, { recursive: true });

    const transcoder = new AudioTranscoder(4, s3Client as any, prodBucket, basePath);
    await transcoder.transcode(localAudioPath, outputDir);
    log("TRANSCODE", "✓ Transcoding and prod upload complete");

    // 3. Extract audio features
    const features = await extractFeatures(tempBucket, key);
    log("FEATURES", `✓ Features extracted (BPM: ${features.bpm.toFixed(1)})`);

    // 4. Save to Recombee
    await saveToRecombee(recombeeService, itemId, features, prodS3Key);
    log("RECOMBEE", `✓ Saved as item "${itemId}"`);

    // 5. Save to Algolia
    log("ALGOLIA", `Saving item ${itemId}`);
    await algoliaService.save({
      objectID: itemId,
      s3Key: prodS3Key,
      duration: features.duration,
      bpm: features.bpm,
    });
    log("ALGOLIA", `✓ Saved as item "${itemId}"`);

    return {
      key,
      itemId,
      prodS3Path: `s3://${prodBucket}/${prodS3Key}`,
      recombeeItemId: itemId,
    };
  } finally {
    log("CLEANUP", "Removing local temp files…");
    safeRm(localAudioPath);
    safeRm(outputDir);
    log("CLEANUP", "✓ Done");
  }
}

async function main() {
  const key =
    process.argv[2] ||
    process.env.AUDIO_KEY ||
    "Guru Randhawa - SIRRA ( Official Video ).m4a";

  const itemId = process.argv[3] || undefined;

  console.log(`\n🎵 Audio pipeline starting`);
  console.log(`   Key    : ${key}`);
  console.log(`   Item ID: ${itemId ?? "(derived from key)"}\n`);

  try {
    const result = await runAudioPipeline({ key, itemId });
    console.log("\n✅ Pipeline complete!");
    console.log("   Prod path     :", result.prodS3Path);
    console.log("   Recombee item :", result.recombeeItemId);
  } catch (err) {
    console.error("\n❌ Pipeline failed:", err);
    process.exit(1);
  }
}

main();