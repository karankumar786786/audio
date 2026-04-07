from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import boto3
import numpy as np
import essentia.standard as es
import logging
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), "..", "audioBackend", ".env")
load_dotenv(dotenv_path=env_path)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

TEMP_DIR = "temp"


class ExtractFeature(BaseModel):
    key: str
    bucket: str = os.getenv("S3_BUCKET", "your-default-bucket")


class AudioFeatures(BaseModel):
    key: str
    duration: float
    sample_rate: float
    loudness: float
    dynamic_complexity: float
    bpm: float
    spectral_centroid: float
    spectral_flux: float
    zero_crossing_rate: float


def download_from_s3(bucket: str, key: str, local_path: str) -> None:
    s3 = boto3.client(
        "s3",
        aws_access_key_id=os.getenv("ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("SECRET_KEY"),
        region_name=os.getenv("REGION", "ap-south-1"),
    )
    logger.info(f"Downloading s3://{bucket}/{key} -> {local_path}")
    try:
        s3.download_file(bucket, key, local_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"S3 download failed: {str(e)}")


def extract_audio_features(file_path: str) -> AudioFeatures:
    # Load audio
    loader = es.MonoLoader(filename=file_path)
    audio = loader()
    sample_rate = 44100.0

    # Global descriptors
    duration = es.Duration()(audio)
    loudness = es.Loudness()(audio)
    dyn_complexity = es.DynamicComplexity()(audio)[0]

    # Rhythm
    bpm, _, _, _, _ = es.RhythmExtractor2013(method="multifeature")(audio)

    # Spectral / frame-level features
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

    return AudioFeatures(
        key=file_path,
        duration=duration,
        sample_rate=sample_rate,
        loudness=loudness,
        dynamic_complexity=dyn_complexity,
        bpm=bpm,
        spectral_centroid=float(np.mean(centroids)),
        spectral_flux=float(np.mean(fluxes)),
        zero_crossing_rate=float(np.mean(zcrs)),
    )


@app.post("/", response_model=AudioFeatures)
def processAudio(body: ExtractFeature):
    os.makedirs(TEMP_DIR, exist_ok=True)

    filename = os.path.basename(body.key)
    local_path = os.path.join(TEMP_DIR, filename)

    try:
        download_from_s3(body.bucket, body.key, local_path)
        features = extract_audio_features(local_path)
        features.key = body.key
        return features
    finally:
        if os.path.exists(local_path):
            os.remove(local_path)
            logger.info(f"Cleaned up {local_path}")