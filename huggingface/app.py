from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import librosa
import numpy as np
import tempfile
import os

app = FastAPI(title="Harmiq API", version="2.0")

# CORS - critico para que Cloudflare pueda llamar al backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_features(path: str) -> dict:
    y, sr = librosa.load(path, sr=44100, mono=True)
    y = librosa.util.normalize(y)

    mfcc       = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20).mean(axis=1)
    centroid   = float(librosa.feature.spectral_centroid(y=y, sr=sr).mean())
    bandwidth  = float(librosa.feature.spectral_bandwidth(y=y, sr=sr).mean())
    zcr        = float(librosa.feature.zero_crossing_rate(y).mean())
    rolloff    = float(librosa.feature.spectral_rolloff(y=y, sr=sr).mean())

    pitch_track, _ = librosa.piptrack(y=y, sr=sr)
    pitch_vals = pitch_track[pitch_track > 0]
    pitch_mean  = float(np.mean(pitch_vals))  if len(pitch_vals) > 0 else 0.0
    pitch_range = float(np.max(pitch_vals) - np.min(pitch_vals)) if len(pitch_vals) > 0 else 0.0

    embedding = np.concatenate([mfcc, [centroid, bandwidth, zcr, rolloff]]).tolist()

    return {
        "embedding":   embedding,
        "pitch_mean":  pitch_mean,
        "pitch_range": pitch_range,
        "voice_type":  classify_voice(pitch_mean)
    }

def classify_voice(pitch_mean: float) -> str:
    if pitch_mean <= 0:  return "Tenor"
    if pitch_mean < 160: return "Baritono"
    if pitch_mean < 300: return "Tenor"
    if pitch_mean < 500: return "Mezzo"
    return "Soprano"

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    suffix = ".webm"
    if file.filename and "." in file.filename:
        suffix = "." + file.filename.rsplit(".", 1)[-1]

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        result = extract_features(tmp_path)
    except Exception as e:
        result = {"error": str(e)}
    finally:
        os.remove(tmp_path)

    return result

@app.get("/")
def root():
    return {
        "status":   "Harmiq API v2 running",
        "endpoint": "POST /analyze",
        "fields":   ["embedding", "pitch_mean", "pitch_range", "voice_type"]
    }
