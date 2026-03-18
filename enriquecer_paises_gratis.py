"""
ENRIQUECER PAÍSES — Versión GRATIS sin API
Detecta el país por género musical y patrones en el nombre del artista.
Cubre ~60-70% de los artistas correctamente.

Uso:
    python enriquecer_paises_gratis.py

Entrada:  harmiq_db_final.json
Salida:   harmiq_db_final.json  (actualizado)
"""

import json, re, sys

INPUT_FILE  = "harmiq_db_final.json"
OUTPUT_FILE = "harmiq_db_final.json"

# ─── REGLAS DE GÉNERO → PAÍS ──────────────────────────────────────────────────
GENRE_RULES = [
    # Asia
    (["k-pop","kpop","korean pop","korean r&b","k-r&b","korean indie"], "KR"),
    (["j-pop","jpop","j-rock","jrock","anime","enka","shibuya-kei","city pop","japanese"], "JP"),
    (["mandopop","c-pop","cpop","chinese pop","chinese rock"], "CN"),
    (["cantopop","hong kong"], "HK"),
    (["thai pop","t-pop","thai"], "TH"),
    (["opm","p-pop","philippine","pilipino"], "PH"),
    (["bollywood","hindi pop","filmi","punjabi pop","bhangra","indian pop"], "IN"),
    (["dangdut","indonesian pop","indo pop"], "ID"),
    (["vietnamese pop","v-pop"], "VN"),
    # Latinoamérica
    (["reggaeton","latin trap","urbano latino","trap latino"], "CO"),
    (["samba","bossa nova","funk carioca","pagode","axé","forró","mpb","sertanejo","baile funk","brazilian"], "BR"),
    (["tango","folklore argentino","cumbia argentina"], "AR"),
    (["cumbia","vallenato","champeta","colombian"], "CO"),
    (["merengue","bachata","dembow","dominican"], "DO"),
    (["son cubano","guaracha","timba","cuban"], "CU"),
    (["salsa","bomba","plena","puerto rican"], "PR"),
    (["musica mexicana","banda","norteño","corrido","ranchera","mariachi"], "MX"),
    (["nueva canción chilena","cumbia chilena","chilean"], "CL"),
    (["chicha","huayno","peruvian"], "PE"),
    # Europa
    (["flamenco","copla","rumba catalana","rumba flamenca"], "ES"),
    (["chanson","variété","french pop","french rock"], "FR"),
    (["schlager","german pop","german rock","neue deutsche welle"], "DE"),
    (["cantautore","italian pop","italian rock","melodia italiana"], "IT"),
    (["fado","portuguese pop"], "PT"),
    (["turbofolk","serbian pop","yugo pop"], "RS"),
    (["laïká","greek pop","rebetiko"], "GR"),
    (["polska","polish pop"], "PL"),
    (["afrobeats","afropop","nigerian pop","juju","highlife","afrofusion"], "NG"),
    (["mbalax","senegalese"], "SN"),
    (["afrikaans","south african"], "ZA"),
    (["morna","cabo verde"], "CV"),
    (["rai","algerian","chaabi"], "DZ"),
    (["shaabi","egyptian pop","arabic pop"], "EG"),
    (["persian pop","iranian"], "IR"),
    (["turkish pop","arabesk"], "TR"),
    # Catalunya
    (["nova cançó","rock català","indie català","català","catalan"], "CAT"),
]

# ─── PATRONES DE NOMBRE → PAÍS ────────────────────────────────────────────────
# Caracteres y scripts específicos
def detect_by_script(name: str) -> str:
    # Japonés (hiragana/katakana/kanji común en artistas JP)
    if re.search(r'[\u3040-\u309f\u30a0-\u30ff]', name):
        return "JP"
    # Hangul (coreano)
    if re.search(r'[\uac00-\ud7af\u1100-\u11ff]', name):
        return "KR"
    # Chino (CJK unificado, sin hiragana/katakana)
    if re.search(r'[\u4e00-\u9fff]', name) and not re.search(r'[\u3040-\u30ff]', name):
        return "CN"
    # Cirílico
    if re.search(r'[\u0400-\u04ff]', name):
        return "RU"
    # Árabe
    if re.search(r'[\u0600-\u06ff]', name):
        return "SA"
    # Tailandés
    if re.search(r'[\u0e00-\u0e7f]', name):
        return "TH"
    # Devanagari (hindi/indio)
    if re.search(r'[\u0900-\u097f]', name):
        return "IN"
    return ""

# Sufijos/prefijos típicos
NAME_PATTERNS = [
    # Artistas K-pop tienen nombres en inglés o apellidos coreanos conocidos
    (r'\b(BTS|BLACKPINK|EXO|TWICE|NCT|Stray Kids|aespa|NewJeans|LE SSERAFIM)\b', "KR"),
    # Patrones hispanos
    (r'\b(DJ|MC|El |La |Los |Las |Del |De la )\b', ""),  # ambiguo, skip
]

def detect_by_name(name: str) -> str:
    script = detect_by_script(name)
    if script:
        return script
    return ""

# ─── MAIN ─────────────────────────────────────────────────────────────────────
def main():
    print(f"Cargando {INPUT_FILE}...")
    with open(INPUT_FILE, encoding="utf-8") as f:
        db = json.load(f)

    singers = db.get("singers", [])
    print(f"Total artistas: {len(singers)}")

    to_process = [s for s in singers if s.get("country_code","INT") in ("INT","","?")]
    print(f"Sin país asignado: {len(to_process)}")

    genre_hits  = 0
    script_hits = 0
    no_hit      = 0

    for s in to_process:
        genres = [g.lower() for g in s.get("genres", [])]
        name   = s.get("name", "")
        assigned = False

        # 1. Por género
        for keywords, country in GENRE_RULES:
            if any(any(kw in g for kw in keywords) for g in genres):
                s["country_code"] = country
                genre_hits += 1
                assigned = True
                break

        # 2. Por script del nombre
        if not assigned:
            country = detect_by_name(name)
            if country:
                s["country_code"] = country
                script_hits += 1
                assigned = True

        if not assigned:
            no_hit += 1
            # Dejar como INT

    # Guardar
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)

    # Resumen
    by_country = {}
    for s in singers:
        c = s.get("country_code","INT")
        by_country[c] = by_country.get(c,0)+1

    total_with = len(singers) - by_country.get("INT",0)
    pct = round(total_with/len(singers)*100, 1)

    print(f"\n✅ {OUTPUT_FILE} actualizado")
    print(f"   Por género musical:  {genre_hits}")
    print(f"   Por script nombre:   {script_hits}")
    print(f"   Sin detectar (INT):  {no_hit}")
    print(f"   Cobertura total:     {total_with}/{len(singers)} ({pct}%)")
    print("\nTop países:")
    for k,v in sorted(by_country.items(), key=lambda x:-x[1])[:15]:
        print(f"  {k:>5}: {v}")
    print(f"\n→ Sube '{OUTPUT_FILE}' a Cloudflare como 'harmiq_db_vectores.json'")

if __name__ == "__main__":
    main()
