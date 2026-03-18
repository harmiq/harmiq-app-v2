import json
import numpy as np
import os

# ===== CONFIG =====
INPUT_JSON = "base_datos_pro_harmiq.json"
OUTPUT_JSON = "harmiq_db_vectores.json"

# ===== CARGAR BASE DE CANCIONES =====
with open(INPUT_JSON, "r", encoding="utf-8") as f:
    data = json.load(f)

# ===== FUNCIÓN: GENERAR VECTOR AUDIO SIMULADO (hasta que tengas audios reales) =====
def generar_vector(c):
    base = [
        c["features"]["tempo"],
        c["features"]["energy"] * 100,
        c["features"]["danceability"] * 100,
        c["features"]["valence"] * 100,
        c["features"]["acousticness"] * 100,
        c["karaoke"]["rango_midi_min"],
        c["karaoke"]["rango_midi_max"]
    ]
    
    # MFCC simulado (20 valores)
    mfcc = np.random.normal(0, 1, 20)
    
    return np.array(base + mfcc.tolist())

# ===== GENERAR MATRIZ =====
raw_db = []

for i, c in enumerate(data["canciones"]):
    vector = generar_vector(c)

    raw_db.append({
        "id": f"song_{i}",
        "titulo": c["titulo"],
        "artista": c["artista"],
        "idioma": c["idioma"],
        "vector": vector.tolist()
    })

# ===== NORMALIZACIÓN =====
data_matrix = np.array([item["vector"] for item in raw_db])

mins = data_matrix.min(axis=0)
maxs = data_matrix.max(axis=0)
ranges = np.where((maxs - mins) == 0, 1, maxs - mins)

for i, item in enumerate(raw_db):
    item["vector_norm"] = ((data_matrix[i] - mins) / ranges).tolist()
    del item["vector"]

# ===== OUTPUT FINAL =====
db_output = {
    "metadata": {
        "normalization": {
            "mins": mins.tolist(),
            "maxs": maxs.tolist()
        }
    },
    "songs": raw_db
}

with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(db_output, f, ensure_ascii=False, indent=2)

print("✅ DB vectorial generada (modo PRO)")
print("🎯 Canciones procesadas:", len(raw_db))