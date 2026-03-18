"""
HARMIQ - Generador de base de datos de voces (ejecutar en LOCAL)
Uso:
  1. Pon archivos .wav en la carpeta samples/ con nombre: TipoVoz_NombreArtista.wav
     Ejemplo: Tenor_FreddieMercury.wav
  2. Ejecuta: python generar_db_pro.py
  3. Sube el harmiq_db_vectores.json generado a Cloudflare
"""

import json
import librosa
import numpy as np
import os

SAMPLES_DIR = "samples"
OUTPUT_FILE = "harmiq_db_vectores.json"

VOICE_TYPES = ["Tenor", "Baritono", "Soprano", "Mezzo"]

def extract(path: str) -> list:
    y, sr = librosa.load(path, sr=44100, mono=True)
    y = librosa.util.normalize(y)

    mfcc      = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20).mean(axis=1)
    centroid  = float(librosa.feature.spectral_centroid(y=y, sr=sr).mean())
    bandwidth = float(librosa.feature.spectral_bandwidth(y=y, sr=sr).mean())
    zcr       = float(librosa.feature.zero_crossing_rate(y).mean())
    rolloff   = float(librosa.feature.spectral_rolloff(y=y, sr=sr).mean())

    return np.concatenate([mfcc, [centroid, bandwidth, zcr, rolloff]]).tolist()

db = []

if not os.path.exists(SAMPLES_DIR):
    os.makedirs(SAMPLES_DIR)
    print(f"Carpeta '{SAMPLES_DIR}' creada. Pon tus .wav ahi y vuelve a ejecutar.")
    exit()

files = [f for f in os.listdir(SAMPLES_DIR) if f.endswith(".wav")]
if not files:
    print(f"No se encontraron .wav en '{SAMPLES_DIR}'")
    exit()

for f in files:
    name_raw = f.replace(".wav", "")
    # Detectar tipo de voz del nombre del archivo (ej: Tenor_FreddieMercury)
    voice_type = "Tenor"
    for vt in VOICE_TYPES:
        if name_raw.startswith(vt + "_"):
            voice_type = vt
            name_raw = name_raw[len(vt)+1:]
            break

    path = os.path.join(SAMPLES_DIR, f)
    print(f"Procesando: {f} -> {name_raw} ({voice_type})")

    try:
        emb = extract(path)
        db.append({
            "name":      name_raw,
            "voiceType": voice_type,
            "features":  {"embedding": emb}
        })
        print(f"  OK - {len(emb)} dimensiones")
    except Exception as e:
        print(f"  ERROR: {e}")

json.dump(db, open(OUTPUT_FILE, "w"), indent=2)
print(f"\nBase de datos generada: {OUTPUT_FILE} ({len(db)} artistas)")
