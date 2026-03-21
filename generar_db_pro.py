"""
HARMIQ - Generador de base de datos de voces (V6.1 Ultra-Precisa)
Analiza tesitura (min/max), timbre dinámico y 27 variables espectrales.
"""

import json
import librosa
import numpy as np
import os
import sys

# Configuración
SAMPLES_DIR = "samples"
OUTPUT_FILE = "harmiq_db_vectores.json"
VOICE_TYPES = ["Tenor", "Baritono", "Bajo", "Soprano", "Mezzo", "Contralto"]

def extract_features(path: str):
    """Extrae la huella digital vocal con rango de tesitura y 27 variables."""
    # Cargamos 45 segundos para cubrir Intro, Verso y el primer Estribillo
    y, sr = librosa.load(path, sr=22050, mono=True, duration=45)
    y = librosa.util.normalize(y)

    # --- 1. TIMBRE Y TEXTURA (13 variables MFCC) ---
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfcc_mean = np.mean(mfccs, axis=1)

    # --- 2. ANÁLISIS DE TESITURA Y NOTAS (Pitch Tracking) ---
    # Extraemos las frecuencias fundamentales (F0) a lo largo de todo el tiempo
    f0, voiced_flag, voiced_probs = librosa.pyin(y, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C6'))
    
    # Filtramos solo donde hay voz real (quitamos silencios de la intro)
    valid_pitches = f0[~np.isnan(f0)]
    
    if len(valid_pitches) > 0:
        f0_min = float(np.min(valid_pitches))
        f0_max = float(np.max(valid_pitches))
        f0_fundamental = float(np.median(valid_pitches)) # La nota donde más tiempo reside
    else:
        f0_min = f0_max = f0_fundamental = 0.0

    # --- 3. VARIABLES ESPECTRALES (Brillo y Estabilidad - 11 variables) ---
    centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
    bandwidth = float(np.mean(librosa.feature.spectral_bandwidth(y=y, sr=sr)))
    rolloff = float(np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr)))
    zcr = float(np.mean(librosa.feature.zero_crossing_rate(y)))
    # Contraste espectral (7 bandas que definen la "limpieza" de la voz)
    contrast = librosa.feature.spectral_contrast(y=y, sr=sr, n_bands=6)
    contrast_mean = np.mean(contrast, axis=1) # 7 valores

    # --- TOTAL: 13 (MFCC) + 3 (Pitch) + 11 (Espectro) = 27 VARIABLES ---
    vector = np.concatenate([
        mfcc_mean,              # 13
        [f0_min, f0_max, f0_fundamental], # 3
        [centroid, bandwidth, rolloff, zcr], # 4
        contrast_mean           # 7
    ])
    
    return vector.tolist()

db = []

if not os.path.exists(SAMPLES_DIR):
    os.makedirs(SAMPLES_DIR)
    sys.exit(f"Carpeta '{SAMPLES_DIR}' creada.")

files = [f for f in os.listdir(SAMPLES_DIR) if f.endswith((".wav", ".mp3"))]
if not files:
    sys.exit(f"No hay audios en '{SAMPLES_DIR}'.")

print(f"🚀 Analizando {len(files)} artistas con 27 variables de precisión...")

for f in files:
    name_raw = f.rsplit('.', 1)[0]
    voice_type = "Desconocido"
    
    for vt in VOICE_TYPES:
        if name_raw.lower().startswith(vt.lower() + "_"):
            voice_type = vt
            name_raw = name_raw[len(vt)+1:].replace("_", " ")
            break

    path = os.path.join(SAMPLES_DIR, f)
    try:
        vector_data = extract_features(path)
        db.append({
            "name": name_raw,
            "voiceType": voice_type,
            "vector": vector_data,
            "range": {
                "min_hz": round(vector_data[13], 2),
                "max_hz": round(vector_data[14], 2),
                "avg_hz": round(vector_data[15], 2)
            }
        })
        print(f"✅ {name_raw}: Rango {round(vector_data[13])}Hz - {round(vector_data[14])}Hz")
    except Exception as e:
        print(f"❌ Error en {f}: {e}")

with open(OUTPUT_FILE, "w", encoding='utf-8') as out:
    json.dump(db, out, indent=2, ensure_ascii=False)

print(f"\n✨ Base de datos generada con éxito ({len(db)} artistas).")