"""
FUSIONAR TODO v3 — Une las 5 fuentes de Harmiq en un único JSON final

Entrada (usa las que encuentre, todas opcionales excepto al menos una):
    harmiq_db_completa.json      ← salida del PASO0 (SIN vectores, muchos artistas del CSV)
    harmiq_db_vectores.json      ← salida del PASO1 (CON vectores, puede estar vacío)
    harmiq_db_global_v7.json     ← 150 artistas globales curados
    base_datos_pro_harmiq.json   ← canciones locales CAT con features reales
    base_datos_full.json         ← canciones locales CAT (algunas genéricas)

Salida:
    harmiq_db_final.json         ← sube a Cloudflare con este nombre

Prioridad si un artista aparece en varias fuentes:
    1. harmiq_db_global_v7       (curado a mano, máxima calidad)
    2. harmiq_db_vectores        (vectores calculados del CSV)
    3. harmiq_db_completa        (datos del CSV sin vector → se calcula aquí)
    4. base_datos_pro_harmiq     (canciones locales con features reales)
    5. base_datos_full           (canciones locales, algunas genéricas)
"""

import json, sys, os
import numpy as np

F_COMPLETA = "harmiq_db_completa.json"
F_VECTORES = "harmiq_db_vectores.json"
F_GLOBAL   = "harmiq_db_global_v7.json"
F_PRO      = "base_datos_pro_harmiq.json"
F_FULL     = "base_datos_full.json"
F_OUTPUT   = "harmiq_db_final.json"

NORM_RANGES = {
    "pitch_mean":        (65.0,  520.0),
    "pitch_std":         (0.0,   80.0),
    "pitch_range":       (0.0,   600.0),
    "spectral_centroid": (200.0, 5500.0),
    "energy_rms":        (0.001, 0.3),
    "zcr":               (0.01,  0.35),
    "spectral_rolloff":  (500.0, 8000.0),
}

ENERGY_STR_MAP = {
    "very_low": 0.015, "low": 0.030, "medium": 0.055,
    "high": 0.090, "very_high": 0.140,
}

def norm(v, feat):
    lo, hi = NORM_RANGES.get(feat, (0.0, 1.0))
    return float(np.clip((v - lo) / max(hi - lo, 1e-9), 0.0, 1.0))

def midi_to_hz(midi):
    return float(440.0 * (2.0 ** ((float(midi) - 69.0) / 12.0)))

def energy_val(val):
    if isinstance(val, (int, float)): return float(val)
    if isinstance(val, str): return ENERGY_STR_MAP.get(val.lower().strip(), 0.055)
    return 0.055

def classify_voice(midi_min, midi_max):
    mid = (midi_min + midi_max) / 2.0
    if mid < 52:  return "bass"
    if mid < 55:  return "bass-baritone"
    if mid < 59:  return "baritone"
    if mid < 63:  return "tenor"
    if mid < 66:  return "countertenor"
    if mid < 68:  return "mezzo-soprano"
    return "soprano"

def synthesize_mfcc(pitch_hz, brillo, energy, voice_type="", pitch_range=0.0):
    """Idéntico al PASO1 — no modificar."""
    pn = np.clip((pitch_hz - 65) / 455, 0, 1)
    bn = np.clip((brillo - 200) / 5300, 0, 1)
    en = np.clip((energy - 0.001) / 0.299, 0, 1)
    rn = np.clip(pitch_range / 600.0, 0, 1)
    vt_offsets = {
        "bass": (-0.08,-0.06,0.04), "bass-baritone": (-0.05,-0.04,0.03),
        "baritone": (0,0,0), "tenor": (0.05,0.04,-0.02),
        "countertenor": (0.10,0.08,-0.04), "contralto": (-0.04,-0.02,0.02),
        "mezzo-soprano": (0.02,0.03,0), "soprano": (0.08,0.06,-0.03),
    }
    o = vt_offsets.get(voice_type.lower(), (0,0,0))
    c = [
        float(np.clip(en+o[0],0,1)), float(np.clip(1.0-bn+o[1],0,1)),
        float(np.clip(pn*0.85+0.08+o[2],0,1)), float(np.clip(pn*0.70+0.12,0,1)),
        float(np.clip(pn*0.55+0.18,0,1)), float(np.clip(bn*0.60+0.20,0,1)),
        float(np.clip(rn*0.50+0.25,0,1)), float(np.clip((pn+bn)*0.40+0.15,0,1)),
        float(np.clip(en*0.45+0.22,0,1)), float(np.clip((1.0-pn)*0.35+0.28,0,1)),
        float(np.clip(bn*0.30+0.32,0,1)), float(np.clip(rn*0.25+0.35,0,1)),
    ]
    seed = int((pitch_hz*100+brillo+len(voice_type)*31) % 2147483647)
    rng = np.random.default_rng(seed)
    rest = rng.normal(0.40, 0.08, 8).clip(0.20, 0.65).tolist()
    return c + rest

def singer_from_profile(s):
    """
    Convierte un singer de harmiq_db_completa (tiene harmiq_profile, SIN vector)
    al formato estándar CON vector calculado. Mismo algoritmo que PASO1.
    """
    profile    = s.get("harmiq_profile", {})
    voice_type = s.get("voice_type", "baritone")

    pitch_hz = float(profile.get("pitch_medio", 200))
    brillo   = float(profile.get("brillo",      2800))
    energy   = energy_val(profile.get("energy_rms", profile.get("energy", 0.055)))
    zcr_val  = float(profile.get("zcr",   0.08))
    rolloff  = float(profile.get("rolloff", 3000))

    r = s.get("range", {})
    low_hz   = float(r.get("low_hz",  pitch_hz * 0.7))
    high_hz  = float(r.get("high_hz", pitch_hz * 1.5))
    pitch_std   = (high_hz - low_hz) / 6.0
    pitch_range = high_hz - low_hz

    scalars = [
        norm(pitch_hz,   "pitch_mean"),
        norm(pitch_std,  "pitch_std"),
        norm(pitch_range,"pitch_range"),
        norm(brillo,     "spectral_centroid"),
        norm(energy,     "energy_rms"),
        norm(zcr_val,    "zcr"),
        norm(rolloff,    "spectral_rolloff"),
    ]

    mfcc_raw = profile.get("mfcc_mean", None)
    if mfcc_raw and len(mfcc_raw) == 20:
        mfcc = [float(np.clip((v + 200) / 400, 0.0, 1.0)) for v in mfcc_raw]
    else:
        mfcc = synthesize_mfcc(pitch_hz, brillo, energy, voice_type, pitch_range)

    vector = [round(x, 6) for x in scalars + mfcc]

    return {
        "id":            s.get("id", s["name"].lower().replace(" ","_")[:40]),
        "name":          s["name"],
        "voice_type":    voice_type,
        "gender":        s.get("gender", ""),
        "range":         s.get("range", {"low_hz": low_hz, "high_hz": high_hz}),
        "genres":        s.get("genres", []),
        "genre_category":s.get("genre_category", "pop"),
        "country_code":  s.get("country_code", "INT"),
        "era":           s.get("era", "2000s+"),
        "style_tags":    s.get("style_tags", []),
        "reference_songs": s.get("reference_songs", []),
        "difficulty":    s.get("difficulty", "intermediate"),
        "pitch_hz":      round(pitch_hz, 2),
        "brillo":        round(brillo, 1),
        "vector":        vector,
        "source":        "csv_completa",
    }

def cancion_to_singer(cancion):
    """Convierte una canción del formato pro/full al formato singer estándar."""
    k  = cancion.get("karaoke", {})
    ft = cancion.get("features", {})
    midi_min = float(k.get("rango_midi_min", 50))
    midi_max = float(k.get("rango_midi_max", 72))
    energy   = float(ft.get("energy", 0.5))
    acous    = float(ft.get("acousticness", 0.3))
    tempo    = float(ft.get("tempo", 110))
    pitch_hz    = midi_to_hz((midi_min + midi_max) / 2.0)
    low_hz      = midi_to_hz(midi_min)
    high_hz     = midi_to_hz(midi_max)
    pitch_range = high_hz - low_hz
    brillo      = float(np.clip(midi_to_hz(midi_max)*1.8*(1-acous*0.4), 200, 5500))
    energy_rms  = float(np.clip(energy*0.28+0.001, 0.001, 0.3))
    zcr         = float(np.clip(energy*0.15+np.clip((tempo-60)/140,0,1)*0.12+0.03, 0.01, 0.35))
    rolloff     = float(np.clip(midi_to_hz(midi_max)*2.5*(1-acous*0.5), 500, 8000))
    voice_type  = classify_voice(midi_min, midi_max)
    scalars = [
        norm(pitch_hz,   "pitch_mean"), norm((high_hz-low_hz)/6.0, "pitch_std"),
        norm(pitch_range,"pitch_range"), norm(brillo, "spectral_centroid"),
        norm(energy_rms, "energy_rms"), norm(zcr, "zcr"), norm(rolloff, "spectral_rolloff"),
    ]
    mfcc   = synthesize_mfcc(pitch_hz, brillo, energy_rms, voice_type, pitch_range)
    vector = [round(x, 6) for x in scalars + mfcc]
    artista = cancion.get("artista", "Unknown")
    return {
        "id":         artista.lower().replace(" ","_").replace("'","").replace(".","")[:40],
        "name":       artista,
        "voice_type": voice_type,
        "gender":     "",
        "range":      {"low_hz": round(low_hz,1), "high_hz": round(high_hz,1),
                       "low_midi": midi_min, "high_midi": midi_max},
        "genres":          [cancion.get("genero","pop")],
        "genre_category":  cancion.get("genero","pop"),
        "country_code":    cancion.get("idioma","INT"),
        "era":             "2000s+",
        "style_tags":      [],
        "reference_songs": [{"title": cancion.get("titulo",""), "popularity": cancion.get("popularidad",70)}],
        "difficulty":      k.get("dificultad_vocal","intermediate"),
        "pitch_hz":        round(pitch_hz, 2),
        "brillo":          round(brillo, 1),
        "vector":          vector,
        "source":          "manual_cat",
    }

def merge_songs(target, extra):
    existing = {s["title"].lower() for s in target.get("reference_songs", [])}
    for song in extra:
        if song.get("title","").lower() not in existing:
            target.setdefault("reference_songs",[]).append(song)
            existing.add(song.get("title","").lower())

def add_to_maestro(maestro, singer):
    key = singer["name"].lower().strip()
    if key not in maestro:
        maestro[key] = singer
    else:
        merge_songs(maestro[key], singer.get("reference_songs", []))

def validate_vector(singer):
    v = singer.get("vector", [])
    if len(v) != 27:
        return False, f"dim={len(v)}"
    out = [x for x in v if x < -0.05 or x > 1.05]
    if out:
        return False, f"valores fuera de rango"
    return True, ""

# ─── MAIN ─────────────────────────────────────────────────────────────────────
def main():
    available = {f: os.path.exists(f) for f in [F_GLOBAL, F_VECTORES, F_COMPLETA, F_PRO, F_FULL]}

    print("Archivos encontrados:")
    for f, ok in available.items():
        print(f"  {'✓' if ok else '✗ (no encontrado)'} {f}")

    if not any(available.values()):
        print("\nERROR: no se encontró ningún archivo fuente.")
        sys.exit(1)

    maestro = {}

    # ── 1. Global v7 (máxima prioridad) ──────────────────────────────────────
    if available[F_GLOBAL]:
        with open(F_GLOBAL, encoding="utf-8") as f:
            singers = json.load(f).get("singers", [])
        for s in singers:
            add_to_maestro(maestro, s)
        print(f"\nGlobal v7:       +{len(singers):>5} artistas  →  total {len(maestro)}")

    # ── 2. Vectores del PASO1 (si los hay) ───────────────────────────────────
    if available[F_VECTORES]:
        with open(F_VECTORES, encoding="utf-8") as f:
            singers = json.load(f).get("singers", [])
        antes = len(maestro)
        for s in singers:
            add_to_maestro(maestro, s)
        print(f"Vectores PASO1:  +{len(singers):>5} cargados  →  {len(maestro)-antes} nuevos  →  total {len(maestro)}")

    # ── 3. harmiq_db_completa (PASO0, SIN vector → calculamos aquí) ──────────
    if available[F_COMPLETA]:
        with open(F_COMPLETA, encoding="utf-8") as f:
            data = json.load(f)
        raw_singers = data.get("singers", [])
        antes = len(maestro)
        errores = 0
        for s in raw_singers:
            try:
                singer = singer_from_profile(s)
                add_to_maestro(maestro, singer)
            except Exception as e:
                errores += 1
        nuevos = len(maestro) - antes
        print(f"DB Completa:     +{len(raw_singers):>5} cargados  →  {nuevos} nuevos  →  total {len(maestro)}"
              + (f"  ({errores} errores)" if errores else ""))

    # ── 4. Canciones locales con features reales ──────────────────────────────
    canciones_locales = []
    if available[F_PRO]:
        with open(F_PRO, encoding="utf-8") as f:
            canciones_locales += json.load(f).get("canciones", [])
    if available[F_FULL]:
        with open(F_FULL, encoding="utf-8") as f:
            canciones_locales += json.load(f).get("canciones", [])

    canciones_reales = [c for c in canciones_locales
                        if not (c["features"]["energy"]==0.7 and c["features"]["tempo"]==110)]
    canciones_gen    = [c for c in canciones_locales
                        if c["features"]["energy"]==0.7 and c["features"]["tempo"]==110]

    antes = len(maestro)
    for c in canciones_reales + canciones_gen:
        add_to_maestro(maestro, cancion_to_singer(c))
    print(f"Canciones locales: {len(canciones_reales)} reales + {len(canciones_gen)} MIDI  →  {len(maestro)-antes} nuevos  →  total {len(maestro)}")

    # ── Validar vectores ──────────────────────────────────────────────────────
    final = list(maestro.values())
    errores_vec = [s["name"] for s in final if not validate_vector(s)[0]]
    if errores_vec:
        print(f"\n⚠️  {len(errores_vec)} vectores con problemas: {errores_vec[:5]}")
    else:
        print(f"\n✅ Todos los vectores OK (27-dim, rango [0,1])")

    # ── Guardar ───────────────────────────────────────────────────────────────
    output = {
        "meta": {
            "version":      "fusionado_v3_final",
            "vector_dims":  27,
            "generated_by": "fusionar_todo.py v3",
            "sources":      [f for f, ok in available.items() if ok],
            "norm_ranges":  NORM_RANGES,
            "total":        len(final),
        },
        "singers": final,
    }

    with open(F_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    # Resumen
    by_region = {}
    for s in final:
        r = s.get("country_code","?")
        by_region[r] = by_region.get(r,0)+1

    print(f"\n✅ {F_OUTPUT} generado con {len(final)} artistas totales")
    print("\nPor región (top 15):")
    for k, v in sorted(by_region.items(), key=lambda x:-x[1])[:15]:
        print(f"  {k:>6}: {v}")
    print(f"\n→ Renombra '{F_OUTPUT}' a 'harmiq_db_vectores.json' y súbelo a Cloudflare")

if __name__ == "__main__":
    main()
