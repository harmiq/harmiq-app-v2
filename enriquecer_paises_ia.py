"""
ENRIQUECER PAÍSES — Detecta el país de cada artista usando Claude API
Procesa en batches de 50 artistas por llamada → muy eficiente y barato (~$2-5 total)

Uso:
    pip install anthropic
    python enriquecer_paises_ia.py --key sk-ant-TUKEY

O pon tu API key en variable de entorno:
    set ANTHROPIC_API_KEY=sk-ant-TUKEY
    python enriquecer_paises_ia.py

Entrada:  harmiq_db_final.json  (o harmiq_db_vectores.json)
Salida:   harmiq_db_final.json  (actualizado con country_code)

Consigue tu API key gratis en: https://console.anthropic.com
"""

import json, os, sys, time, argparse

try:
    import anthropic
except ImportError:
    print("ERROR: pip install anthropic")
    sys.exit(1)

# ─── CONFIG ──────────────────────────────────────────────────────────────────
INPUT_FILE  = "harmiq_db_final.json"
OUTPUT_FILE = "harmiq_db_final.json"   # sobreescribe
BATCH_SIZE  = 50                        # artistas por llamada a la API
SAVE_EVERY  = 200                       # guardar progreso cada N artistas
MODEL       = "claude-haiku-4-5-20251001"  # el más barato y rápido

# Géneros → país por defecto (complementa a la IA para géneros muy locales)
GENRE_COUNTRY_HINTS = {
    "k-pop": "KR", "korean": "KR",
    "j-pop": "JP", "j-rock": "JP", "anime": "JP", "enka": "JP",
    "mandopop": "CN", "cantopop": "HK", "c-pop": "CN",
    "reggaeton": "CO", "dembow": "DO",
    "samba": "BR", "bossa nova": "BR", "funk carioca": "BR", "pagode": "BR", "axé": "BR",
    "flamenco": "ES", "copla": "ES",
    "chanson": "FR", "variété française": "FR",
    "afrobeats": "NG", "afropop": "NG",
    "bhangra": "IN", "bollywood": "IN", "hindi": "IN",
    "cumbia": "CO", "vallenato": "CO",
    "tango": "AR",
    "merengue": "DO",
    "bachata": "DO",
    "son cubano": "CU", "guaracha": "CU",
    "turbofolk": "RS",
}

def genre_hint(genres: list) -> str:
    """Devuelve país si el género da una pista clara."""
    for g in genres:
        g_low = g.lower()
        for genre_key, country in GENRE_COUNTRY_HINTS.items():
            if genre_key in g_low:
                return country
    return ""

def detect_countries_batch(client, artists: list) -> dict:
    """
    Envía un batch de artistas a Claude y recibe {nombre: country_code}.
    artists = [{"name": "...", "genres": [...], "hint": "..."}]
    """
    lines = []
    for i, a in enumerate(artists):
        genre_str = ", ".join(a.get("genres", []))[:50]
        lines.append(f'{i+1}. {a["name"]} | géneros: {genre_str}')

    prompt = f"""Necesito el código de país ISO 3166-1 alpha-2 de cada artista musical.
Responde SOLO con JSON, formato exacto: {{"1": "US", "2": "ES", ...}}
Si no estás seguro, usa "INT".
Usa los códigos estándar: US GB ES FR DE IT JP KR CN BR AR MX CO CL PE VE CU PR DO
RU UA PL SE NO DK FI NL BE PT AU CA ZA NG SN TZ EG MA IN ID PH MY TH VN TR GR
CAT para artistas catalanes específicos.

Artistas:
{chr(10).join(lines)}"""

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )
        text = response.content[0].text.strip()
        # limpiar posibles markdown
        if "```" in text:
            text = text.split("```")[1].replace("json","").strip()
        result = json.loads(text)
        # mapear índice → nombre
        return {artists[int(k)-1]["name"]: v for k, v in result.items()
                if k.isdigit() and int(k)-1 < len(artists)}
    except Exception as e:
        print(f"    ⚠️  Error en batch: {e}")
        return {}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--key", help="Anthropic API key (o usa ANTHROPIC_API_KEY env)")
    parser.add_argument("--input",  default=INPUT_FILE)
    parser.add_argument("--output", default=OUTPUT_FILE)
    parser.add_argument("--batch",  type=int, default=BATCH_SIZE)
    args = parser.parse_args()

    api_key = args.key or os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        print("ERROR: Necesitas una API key.")
        print("  Opción 1: python enriquecer_paises_ia.py --key sk-ant-TUKEY")
        print("  Opción 2: set ANTHROPIC_API_KEY=sk-ant-TUKEY")
        print("  Consíguela en: https://console.anthropic.com")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    print(f"Cargando {args.input}...")
    with open(args.input, encoding="utf-8") as f:
        db = json.load(f)

    singers = db.get("singers", [])
    print(f"Total artistas: {len(singers)}")

    # Solo procesar los que tienen INT o están vacíos
    to_process = [s for s in singers
                  if s.get("country_code","INT") in ("INT","","?")]
    already_done = len(singers) - len(to_process)
    print(f"Ya tienen país:  {already_done}")
    print(f"A procesar:      {len(to_process)}")

    if not to_process:
        print("✅ Todos los artistas ya tienen país asignado.")
        return

    # Paso 1: asignar por género (gratis, sin API)
    genre_assigned = 0
    remaining = []
    for s in to_process:
        hint = genre_hint(s.get("genres", []))
        if hint:
            s["country_code"] = hint
            genre_assigned += 1
        else:
            remaining.append(s)

    print(f"\nAsignados por género: {genre_assigned}")
    print(f"Enviando a IA:        {len(remaining)}")

    # Paso 2: batches a Claude para el resto
    total_batches = (len(remaining) + args.batch - 1) // args.batch
    processed = 0
    ia_assigned = 0

    for i in range(0, len(remaining), args.batch):
        batch = remaining[i:i+args.batch]
        batch_num = i // args.batch + 1

        print(f"  Batch {batch_num}/{total_batches} ({len(batch)} artistas)...", end=" ", flush=True)

        results = detect_countries_batch(client, batch)

        for s in batch:
            country = results.get(s["name"], "INT")
            s["country_code"] = country
            if country != "INT":
                ia_assigned += 1

        processed += len(batch)
        print(f"✓ ({ia_assigned} con país hasta ahora)")

        # Guardar progreso periódicamente
        if processed % SAVE_EVERY == 0:
            with open(args.output, "w", encoding="utf-8") as f:
                json.dump(db, f, ensure_ascii=False, indent=2)
            print(f"    💾 Progreso guardado ({processed}/{len(remaining)})")

        # Pequeña pausa para no saturar la API
        if batch_num < total_batches:
            time.sleep(0.3)

    # Guardar resultado final
    db["meta"]["country_enriched"] = True
    db["meta"]["total"] = len(singers)

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)

    # Resumen
    by_country = {}
    for s in singers:
        c = s.get("country_code","INT")
        by_country[c] = by_country.get(c,0)+1

    print(f"\n✅ Listo. {args.output} actualizado.")
    print(f"   Por género (sin API): {genre_assigned}")
    print(f"   Por IA (Claude):      {ia_assigned}")
    print(f"   Sin detectar (INT):   {by_country.get('INT',0)}")
    print("\nTop países detectados:")
    for k,v in sorted(by_country.items(), key=lambda x:-x[1])[:15]:
        print(f"  {k:>5}: {v}")
    print(f"\n→ Sube '{args.output}' a Cloudflare como 'harmiq_db_vectores.json'")

if __name__ == "__main__":
    main()
