import os
# Force Inngest into Dev Mode
os.environ["INNGEST_DEV"] = "1"

import uvicorn
import logging
import boto3
import numpy as np
import essentia.standard as es
from pydantic import BaseModel
from dotenv import load_dotenv
import inngest
import inngest.fast_api
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import traceback

# Load environment
env_path = os.path.join(os.path.dirname(__file__), "..", "audioBackend", ".env")
load_dotenv(dotenv_path=env_path)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("inngest")

TEMP_DIR = "temp"

# Initialize Inngest
inngest_client = inngest.Inngest(
    app_id="audio-processing",
    logger=logger
)

# ── Helpers ───────────────────────────────────────────────────────────────────

def download_from_s3(bucket: str, key: str, local_path: str) -> None:
    s3 = boto3.client(
        "s3",
        aws_access_key_id=os.getenv("ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("SECRET_KEY"),
        region_name=os.getenv("REGION", "ap-south-1"),
    )
    logger.info(f"Downloading s3://{bucket}/{key} -> {local_path}")
    s3.download_file(bucket, key, local_path)


def extract_audio_features(file_path: str) -> dict:
    logger.info(f"Extracting features from: {file_path}")
    loader = es.MonoLoader(filename=file_path)
    audio = loader()
    sample_rate = 44100.0

    duration = es.Duration()(audio)
    loudness = es.Loudness()(audio)
    dyn_complexity = es.DynamicComplexity()(audio)[0]
    bpm, _, _, _, _ = es.RhythmExtractor2013(method="multifeature")(audio)

    frame_size, hop_size = 2048, 512
    windowing = es.Windowing(type="hann")
    spectrum_algo = es.Spectrum()
    centroid_algo = es.SpectralCentroidTime(sampleRate=sample_rate)
    flux_algo = es.Flux()
    zcr_algo = es.ZeroCrossingRate()

    centroids, fluxes, zcrs = [], [], []

    for frame in es.FrameGenerator(audio, frameSize=frame_size, hopSize=hop_size, startFromZero=True):
        windowed = windowing(frame)
        spec = spectrum_algo(windowed)
        centroids.append(centroid_algo(frame))
        fluxes.append(flux_algo(spec))
        zcrs.append(zcr_algo(frame))

    return {
        "key": file_path,
        "duration": float(duration),
        "sample_rate": float(sample_rate),
        "loudness": float(loudness),
        "dynamic_complexity": float(dyn_complexity),
        "bpm": float(bpm),
        "spectral_centroid": float(np.mean(centroids)),
        "spectral_flux": float(np.mean(fluxes)),
        "zero_crossing_rate": float(np.mean(zcrs)),
    }


# ── Inngest Function ──────────────────────────────────────────────────────────

@inngest_client.create_function(
    fn_id="extract-features",
    trigger=inngest.TriggerEvent(event="audio/song.features.extract"),
)
async def extract_features_job(ctx: inngest.Context):
    # Use ctx.step for v0.5.18
    step = ctx.step
    data = ctx.event.data or {}
    print(f"\n[PYTHON DEBUG] Raw Event Data: {data}")
    job_id = data.get("jobId")
    song_id = data.get("songId")
    key = data.get("key")
    bucket = data.get("bucket", os.getenv("S3_BUCKET", "videotranscodetemp"))

    logger.info(f"[HANDLER] Starting extraction for jobId: {job_id} (songId: {song_id})")

    if not key or not job_id:
        return {"status": "error", "message": "Missing key or jobId"}

    os.makedirs(TEMP_DIR, exist_ok=True)
    local_path = os.path.join(TEMP_DIR, os.path.basename(key))

    try:
        # 1. Download
        def download_and_extract():
            download_from_s3(bucket, key, local_path)
            return extract_audio_features(local_path)

        # Combine into one step to ensure file exists during extraction
        features_dict = await step.run(
            "process-audio",
            download_and_extract
        )

        # 3. Trigger callback to TS
        await step.send_event(
            "callback-to-ts",
            inngest.Event(
                name="audio/song.features.extracted",
                data={
                    "jobId": job_id,
                    "songId": song_id,
                    "features": features_dict,
                },
            ),
        )

        return {"status": "success", "jobId": job_id}
    finally:
        if os.path.exists(local_path):
            os.remove(local_path)
            logger.info(f"Cleaned up {local_path}")


# ── FastAPI ───────────────────────────────────────────────────────────────────

app = FastAPI()

# Optional: keep the raw inspector for one more run to be safe
@app.middleware("http")
async def raw_inspector(request: Request, call_next):
    if "/api/inngest" in request.url.path and request.method == "POST":
        logger.info(f"Incoming Inngest POST to {request.url.path}")
    return await call_next(request)

inngest.fast_api.serve(app, inngest_client, [extract_features_job])

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)