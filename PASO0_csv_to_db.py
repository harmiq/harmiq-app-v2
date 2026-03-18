"""
PASO 0 — Convertir canciones_maestras.csv → harmiq_db_completa.json
Ejecutar ANTES que PASO1_precalcular_db.py

Uso:
    pip install pandas numpy
    python PASO0_csv_to_db.py

Entrada:  canciones_maestras.csv  (separador ; )
Salida:   harmiq_db_completa.json (formato exacto que espera PASO1)

Campos del CSV que SE USAN:
    artists, track_name, track_genre, popularity
    energy, acousticness, tempo
    nota_min_midi, nota_max_midi, nota_min, nota_max

Campos que SE DESCARTAN (no aportan nada a Harmiq):
    track_id, duration_ms, explicit, danceability,
    key, loudness, mode, speechiness, instrumentalness,
    liveness, valence, time_signature

Lógica de conversión:
    nota_min_midi  →  range.low_hz  (MIDI a Hz)
    nota_max_midi  →  range.high_hz + brillo estimado
    media de notas →  pitch_medio
    energy         →  energy_rms  (escala Spotify 0-1 a RMS 0.001-0.3)
    tempo          →  zcr estimado
    acousticness   →  rolloff estimado
    nota_min_midi  →  voice_type (clasificación por rango)
"""

import json
import sys
import os

try:
    import pandas as pd
    import numpy as np
except ImportError:
    print("ERROR: Instala dependencias: pip install pandas numpy")
    sys.exit(1)


# ─── CONFIG ──────────────────────────────────────────────────────────────────
INPUT_CSV   = "canciones_maestras.csv"
OUTPUT_JSON = "harmiq_db_completa.json"
SEP         = ";"        # separador del CSV
MIN_SONGS   = 2          # mínimo canciones por artista para incluirlo
MAX_SONGS   = 6          # máximo canciones de referencia a guardar por artista


# ─── CONVERSIÓN MIDI → Hz ────────────────────────────────────────────────────
def midi_to_hz(midi: float) -> float:
    """Convierte nota MIDI a frecuencia en Hz. A4 = 69 = 440 Hz."""
    return float(440.0 * (2.0 ** ((midi - 69.0) / 12.0)))


# ─── CLASIFICACIÓN DE VOZ POR RANGO MIDI ─────────────────────────────────────
def classify_voice_type(nota_min_midi: float, nota_max_midi: float,
                        gender_hint: str = "") -> str:
    """
    Clasifica el tipo de voz según el rango MIDI.
    Rangos aproximados (en MIDI):
        Bass:          E2(40) – E4(64)
        Bass-baritone: A2(45) – F4(65)
        Baritone:      G2(43) – G4(67)
        Tenor:         C3(48) – C5(72)
        Countertenor:  G3(55) – G5(79)
        Contralto:     F3(53) – F5(77)
        Mezzo-soprano: A3(57) – A5(81)
        Soprano:       C4(60) – C6(84)
    """
    mid = (nota_min_midi + nota_max_midi) / 2.0
    span = nota_max_midi - nota_min_midi

    # Voces masculinas (mid bajo)
    if mid < 52:
        return "bass"
    if mid < 55:
        return "bass-baritone"
    if mid < 59:
        return "baritone"
    if mid < 63:
        return "tenor"
    if mid < 66 and span > 20:
        return "countertenor"

    # Voces femeninas (mid alto)
    if mid < 63:
        return "contralto"
    if mid < 68:
        return "mezzo-soprano"
    return "soprano"


# ─── ESTIMAR brillo (spectral centroid proxy) DESDE nota_max_midi ─────────────
def estimate_brillo(nota_max_midi: float, acousticness: float) -> float:
    """
    El brillo (spectral centroid) no está directamente en el CSV.
    Lo estimamos desde nota_max (cuanto más alta la nota máxima, más brillo)
    y acousticness (más acústico = menos brillo digital).
    Rango objetivo: 200 – 5500 Hz (igual que NORM_RANGES en PASO1).
    """
    hz_max = midi_to_hz(nota_max_midi)
    # El centroide espectral de una voz está típicamente entre 1x-3x la frecuencia fundamental
    brillo_base = hz_max * 1.8
    # acousticness Spotify: 1.0 = muy acústico (centroide más bajo), 0.0 = electrónico
    acustic_factor = 1.0 - (acousticness * 0.4)
    brillo = float(np.clip(brillo_base * acustic_factor, 200.0, 5500.0))
    return round(brillo, 1)


# ─── ESTIMAR zcr DESDE energy + tempo ────────────────────────────────────────
def estimate_zcr(energy: float, tempo: float) -> float:
    """
    Zero Crossing Rate no está en Spotify. Lo estimamos:
    - energy alta + tempo alto → más ZCR (más cambios de signo)
    - Rango objetivo: 0.01 – 0.35
    """
    tempo_norm = float(np.clip((tempo - 60.0) / 140.0, 0.0, 1.0))
    zcr = float(np.clip(energy * 0.15 + tempo_norm * 0.12 + 0.03, 0.01, 0.35))
    return round(zcr, 4)


# ─── ESTIMAR rolloff DESDE acousticness ──────────────────────────────────────
def estimate_rolloff(acousticness: float, nota_max_midi: float) -> float:
    """
    Spectral rolloff: frecuencia bajo la cual está el 85% de la energía.
    Más acústico → rolloff más bajo. Notas más altas → rolloff más alto.
    Rango objetivo: 500 – 8000 Hz
    """
    hz_max = midi_to_hz(nota_max_midi)
    rolloff_base = hz_max * 2.5
    acustic_factor = 1.0 - (acousticness * 0.5)
    rolloff = float(np.clip(rolloff_base * acustic_factor, 500.0, 8000.0))
    return round(rolloff, 1)


# ─── CONVERTIR energy Spotify (0-1) → RMS (0.001-0.3) ───────────────────────
def spotify_energy_to_rms(energy_spotify: float) -> float:
    """
    Spotify energy: 0.0 (silencio) – 1.0 (muy intenso)
    RMS target: 0.001 – 0.3
    """
    rms = float(np.clip(energy_spotify * 0.28 + 0.001, 0.001, 0.3))
    return round(rms, 5)


# ─── MAIN ─────────────────────────────────────────────────────────────────────
def main():
    if not os.path.exists(INPUT_CSV):
        print(f"ERROR: No encuentro '{INPUT_CSV}'")
        print(f"Pon este script en la misma carpeta que {INPUT_CSV}")
        sys.exit(1)

    print(f"Leyendo {INPUT_CSV}...")
    try:
        df = pd.read_csv(INPUT_CSV, sep=SEP, low_memory=False)
    except Exception as e:
        print(f"ERROR al leer el CSV: {e}")
        sys.exit(1)

    # ── Validar columnas necesarias ──────────────────────────────────────────
    required = {"artists", "track_name", "energy", "acousticness", "tempo",
                "track_genre", "popularity", "nota_min_midi", "nota_max_midi",
                "nota_min", "nota_max"}
    missing = required - set(df.columns)
    if missing:
        print(f"ERROR: Faltan columnas en el CSV: {missing}")
        print(f"Columnas encontradas: {list(df.columns)}")
        sys.exit(1)

    print(f"Filas totales: {len(df)}")

    # ── Limpiar y tipar ──────────────────────────────────────────────────────
    df = df.dropna(subset=["artists", "track_name", "nota_min_midi", "nota_max_midi"])
    df["nota_min_midi"]  = pd.to_numeric(df["nota_min_midi"],  errors="coerce")
    df["nota_max_midi"]  = pd.to_numeric(df["nota_max_midi"],  errors="coerce")
    df["energy"]         = pd.to_numeric(df["energy"],         errors="coerce").fillna(0.5)
    df["acousticness"]   = pd.to_numeric(df["acousticness"],   errors="coerce").fillna(0.3)
    df["tempo"]          = pd.to_numeric(df["tempo"],          errors="coerce").fillna(120.0)
    df["popularity"]     = pd.to_numeric(df["popularity"],     errors="coerce").fillna(0)
    df = df.dropna(subset=["nota_min_midi", "nota_max_midi"])
    df = df[df["nota_min_midi"] > 0]
    df = df[df["nota_max_midi"] > df["nota_min_midi"]]

    print(f"Filas limpias: {len(df)}")

    # ── Limpiar nombres de artistas (puede haber varios en una celda) ────────
    # Muchos CSVs de Spotify ponen: "['Artist A', 'Artist B']"
    # Nos quedamos con el primero
    def clean_artist(raw):
        s = str(raw).strip()
        # formato lista Python en texto
        if s.startswith("["):
            s = s.strip("[]").replace("'", "").replace('"', "").split(",")[0].strip()
        return s

    df["artist_clean"] = df["artists"].apply(clean_artist)

    # ── Agrupar por artista ──────────────────────────────────────────────────
    grouped = df.groupby("artist_clean")
    print(f"Artistas únicos encontrados: {len(grouped)}")

    singers = []
    skipped = 0

    for artist_name, group in grouped:
        if len(group) < MIN_SONGS:
            skipped += 1
            continue

        # Estadísticas del artista
        nota_min_midi_mean = float(group["nota_min_midi"].mean())
        nota_max_midi_mean = float(group["nota_max_midi"].mean())
        nota_min_midi_min  = float(group["nota_min_midi"].min())
        nota_max_midi_max  = float(group["nota_max_midi"].max())

        energy_mean       = float(group["energy"].mean())
        acousticness_mean = float(group["acousticness"].mean())
        tempo_mean        = float(group["tempo"].mean())

        # Conversiones
        pitch_hz   = midi_to_hz((nota_min_midi_mean + nota_max_midi_mean) / 2.0)
        low_hz     = midi_to_hz(nota_min_midi_min)
        high_hz    = midi_to_hz(nota_max_midi_max)
        brillo     = estimate_brillo(nota_max_midi_mean, acousticness_mean)
        energy_rms = spotify_energy_to_rms(energy_mean)
        zcr        = estimate_zcr(energy_mean, tempo_mean)
        rolloff    = estimate_rolloff(acousticness_mean, nota_max_midi_mean)
        voice_type = classify_voice_type(nota_min_midi_mean, nota_max_midi_mean)

        # Género predominante
        genre = str(group["track_genre"].mode().iloc[0]) if "track_genre" in group.columns else "pop"

        # Top canciones de referencia (las más populares)
        top_songs = (
            group.sort_values("popularity", ascending=False)
                 .head(MAX_SONGS)[["track_name", "popularity"]]
                 .to_dict("records")
        )
        reference_songs = [
            {"title": str(s["track_name"]), "popularity": int(s["popularity"])}
            for s in top_songs
        ]

        # ID limpio
        singer_id = artist_name.lower().replace(" ", "_").replace("'", "").replace(".", "")[:40]

        singer = {
            "id":   singer_id,
            "name": artist_name,
            "voice_type": voice_type,
            "gender": "",           # no está en el CSV, déjalo vacío
            "range": {
                "low_hz":        round(low_hz, 1),
                "high_hz":       round(high_hz, 1),
                "low_midi":      round(nota_min_midi_min, 1),
                "high_midi":     round(nota_max_midi_max, 1),
                "low_note":      str(group["nota_min"].mode().iloc[0]) if "nota_min" in group.columns else "",
                "high_note":     str(group["nota_max"].mode().iloc[0]) if "nota_max" in group.columns else "",
            },
            "genres":         [genre],
            "genre_category": genre,
            "country_code":   "INT",
            "era":            "2000s+",
            "style_tags":     [],
            "reference_songs": reference_songs,
            "difficulty":     "intermediate",
            "harmiq_profile": {
                "pitch_medio":  round(pitch_hz, 2),
                "brillo":       brillo,
                "energy_rms":   energy_rms,
                "zcr":          zcr,
                "rolloff":      rolloff,
            }
        }

        singers.append(singer)

    print(f"\nArtistas incluidos: {len(singers)}")
    print(f"Artistas omitidos (menos de {MIN_SONGS} canciones): {skipped}")

    # ── Muestra de verificación ──────────────────────────────────────────────
    print("\nMUESTRA (primeros 5):")
    for s in singers[:5]:
        p = s["harmiq_profile"]
        print(f"  {s['name']} ({s['voice_type']}) — pitch={p['pitch_medio']:.1f}Hz "
              f"brillo={p['brillo']:.0f}Hz energy_rms={p['energy_rms']:.4f}")

    # ── Guardar JSON ─────────────────────────────────────────────────────────
    output = {
        "meta": {
            "source":          INPUT_CSV,
            "generated_by":    "PASO0_csv_to_db.py",
            "total_artists":   len(singers),
            "fields_used":     ["artists", "track_name", "track_genre", "popularity",
                                "energy", "acousticness", "tempo",
                                "nota_min_midi", "nota_max_midi", "nota_min", "nota_max"],
            "fields_discarded": ["track_id", "duration_ms", "explicit", "danceability",
                                 "key", "loudness", "mode", "speechiness",
                                 "instrumentalness", "liveness", "valence",
                                 "time_signature"]
        },
        "singers": singers
    }

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n✅ {OUTPUT_JSON} generado con {len(singers)} artistas")
    print(f"\nSiguiente paso:")
    print(f"  python PASO1_precalcular_db.py")
    print(f"  (asegúrate de que {OUTPUT_JSON} está en la misma carpeta)")


if __name__ == "__main__":
    main()
