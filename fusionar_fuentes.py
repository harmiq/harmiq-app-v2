import json
import pandas as pd

# ===== CARGAR JSON BASE =====
with open("base_datos_pro_harmiq.json", "r", encoding="utf-8") as f:
    data = json.load(f)

canciones = data["canciones"]

# ===== CARGAR CSV =====
try:
    df = pd.read_csv("canciones_maestras.csv")

    for _, row in df.iterrows():
        canciones.append({
            "titulo": row["titulo"],
            "artista": row["artista"],
            "idioma": row.get("idioma", "CAT"),
            "genero": row.get("genero", "pop"),
            "features": {
                "energy": 0.7,
                "danceability": 0.7,
                "valence": 0.6,
                "acousticness": 0.2,
                "tempo": 110
            },
            "karaoke": {
                "dificultad_vocal": "media",
                "rango_midi_min": 50,
                "rango_midi_max": 75
            },
            "popularidad": 80
        })
except:
    print("⚠️ CSV no encontrado")

# ===== ELIMINAR DUPLICADOS =====
unique = {}
for c in canciones:
    key = (c["titulo"].lower(), c["artista"].lower())
    unique[key] = c

canciones_final = list(unique.values())

# ===== GUARDAR =====
output = {
    "metadata": {"total": len(canciones_final)},
    "canciones": canciones_final,
    "artistas": data["artistas"]
}

with open("base_datos_full.json", "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print("✅ Base unificada creada:", len(canciones_final))