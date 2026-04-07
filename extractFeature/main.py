from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import boto3
import numpy as np
import essentia.standard as es
import logging

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
    beats_count: int
    spectral_centroid: float
    spectral_rolloff: float
    spectral_flux: float
    zero_crossing_rate: float
    mfcc_mean: list[float]
    mfcc_std: list[float]
    chroma_mean: list[float]
    mel_bands_mean: list[float]
    vector: list[float]  # Final combined feature vector

def download_from_s3(bucket: str, key: str, local_path: str) -> None:
    """Download a file from S3 to local path."""
    s3 = boto3.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_REGION", "us-east-1"),
    )
    logger.info(f"Downloading s3://{bucket}/{key} -> {local_path}")
    try:
        s3.download_file(bucket, key, local_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"S3 download failed: {str(e)}")

def extract_audio_features(file_path: str) -> AudioFeatures:
    """Extract audio features using Essentia and return a feature vector."""
    
    # ── Load audio ──────────────────────────────────────────────────────────
    loader = es.MonoLoader(filename=file_path)
    audio = loader()
    sample_rate = 44100.0  # MonoLoader default

    # ── Global descriptors ───────────────────────────────────────────────────
    duration        = es.Duration()(audio)
    loudness        = es.Loudness()(audio)
    dyn_complexity  = es.DynamicComplexity()(audio)[0]

    # ── Rhythm ───────────────────────────────────────────────────────────────
    rhythm_extractor = es.RhythmExtractor2013(method="multifeature")
    bpm, beats, _, _, _ = rhythm_extractor(audio)
    beats_count = len(beats)

    # ── Spectral / frame-level features ─────────────────────────────────────
    frame_size, hop_size = 2048, 512
    windowing       = es.Windowing(type="hann")
    spectrum_algo   = es.Spectrum()
    mfcc_algo       = es.MFCC(numberCoefficients=13)
    centroid_algo   = es.SpectralCentroidTime(sampleRate=sample_rate)
    rolloff_algo    = es.RollOff()
    flux_algo       = es.Flux()
    zcr_algo        = es.ZeroCrossingRate()

    mfccs, chromas, mel_bands_list = [], [], []
    centroids, rolloffs, fluxes, zcrs = [], [], [], []

    chroma_algo     = es.HPCP()
    mel_algo        = es.MelBands(numberBands=26, sampleRate=sample_rate)

    for frame in es.FrameGenerator(audio, frameSize=frame_size, hopSize=hop_size, startFromZero=True):
        windowed    = windowing(frame)
        spec        = spectrum_algo(windowed)

        _, mfcc_coeffs = mfcc_algo(spec)
        mfccs.append(mfcc_coeffs)

        peaks_freq, peaks_mag = es.SpectralPeaks()(spec)
        if len(peaks_freq) > 0:
            hpcp = chroma_algo(peaks_freq, peaks_mag)
            chromas.append(hpcp)

        mel_bands_list.append(mel_algo(spec))
        centroids.append(centroid_algo(frame))
        rolloffs.append(rolloff_algo(spec))
        fluxes.append(flux_algo(spec))
        zcrs.append(zcr_algo(frame))

    mfcc_arr   = np.array(mfccs)
    mfcc_mean  = mfcc_arr.mean(axis=0).tolist()
    mfcc_std   = mfcc_arr.std(axis=0).tolist()

    chroma_mean = (np.array(chromas).mean(axis=0).tolist()
                   if chromas else [0.0] * 12)

    mel_mean    = np.array(mel_bands_list).mean(axis=0).tolist()

    spec_centroid = float(np.mean(centroids))
    spec_rolloff  = float(np.mean(rolloffs))
    spec_flux     = float(np.mean(fluxes))
    zcr           = float(np.mean(zcrs))

    # ── Combine into a single feature vector ────────────────────────────────
    vector = (
        [duration, loudness, dyn_complexity, bpm, float(beats_count),
         spec_centroid, spec_rolloff, spec_flux, zcr]
        + mfcc_mean          # 13 dims
        + mfcc_std           # 13 dims
        + chroma_mean        # 12 dims
        + mel_mean           # 26 dims  → total: 9+13+13+12+26 = 73 dims
    )

    return AudioFeatures(
        key=file_path,
        duration=duration,
        sample_rate=sample_rate,
        loudness=loudness,
        dynamic_complexity=dyn_complexity,
        bpm=bpm,
        beats_count=beats_count,
        spectral_centroid=spec_centroid,
        spectral_rolloff=spec_rolloff,
        spectral_flux=spec_flux,
        zero_crossing_rate=zcr,
        mfcc_mean=mfcc_mean,
        mfcc_std=mfcc_std,
        chroma_mean=chroma_mean,
        mel_bands_mean=mel_mean,
        vector=vector,
    )

@app.post("/", response_model=AudioFeatures)
def processAudio(body: ExtractFeature):
    os.makedirs(TEMP_DIR, exist_ok=True)

    # Derive a safe local filename from the S3 key
    filename   = os.path.basename(body.key)
    local_path = os.path.join(TEMP_DIR, filename)

    try:
        # 1. Download from S3
        download_from_s3(body.bucket, body.key, local_path)

        # 2. Extract features
        features = extract_audio_features(local_path)
        features.key = body.key   # return original S3 key, not local path

        return features

    finally:
        # 3. Cleanup — always runs even on error
        if os.path.exists(local_path):
            os.remove(local_path)
            logger.info(f"Cleaned up {local_path}")