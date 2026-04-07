"""
Paso 1: Añadir canonical tags a todas las páginas de artistas existentes.
Paso 2: Generar nuevas páginas para artistas del DB sin página.
"""

import os
import re
import json

ARTISTAS_DIR = r"E:\harmiq-app-final\cloudflare\artistas"
DB_PATH = r"E:\harmiq-app-final\harmiq_db_completa.json"
BASE_URL = "https://harmiq.app/artistas/"

# ── Normalización de tipos vocales ──────────────────────────────────────────
VT_NORM = {
    'soprano': 'Soprano',
    'mezzo-soprano': 'Mezzosoprano',
    'mezzosoprano': 'Mezzosoprano',
    'contralto': 'Contralto',
    'tenor': 'Tenor',
    'baritone': 'Baritono',
    'baritono': 'Baritono',
    'bass-baritone': 'Baritono',
    'bass baritone': 'Baritono',
    'bass': 'Bajo',
    'bajo': 'Bajo',
    'countertenor': 'Tenor',
    'counter-tenor': 'Tenor',
    'mezzo': 'Mezzosoprano',
}

KNOWN_FEMALE = {
    "adele","ariana-grande","beyonce","billie-eilish","celine-dion",
    "dua-lipa","ella-fitzgerald","katy-perry","lady-gaga","lana-del-rey",
    "madonna","mariah-carey","nina-simone","norah-jones","olivia-rodrigo",
    "sabrina-carpenter","shakira","taylor-swift","whitney-houston",
    "anne-marie","aitana","karol-g","lola-indigo","melanie-martinez",
    "tove-lo","donna-summer","janis-joplin","alicia-keys","amy-winehouse",
    "rosalia","rihanna","sza","lizzo","camila-cabello","selena-gomez",
    "jennifer-lopez","gloria-estefan","isabel-pantoja","rocio-durcal",
    "mercedes-sosa","chavela-vargas","lila-downs","ana-gabriel",
    "lucero","thalia","paulina-rubio","fey","alejandra-guzman",
    "paty-cantu","belinda","ha-sungwoon","iu","taeyeon","luna",
}

FEMALE_TYPES = {"Soprano", "Mezzosoprano", "Contralto"}

VOICE_DESC = {
    "Soprano": "Las voces Soprano son las mas altas y cristalinas, con un timbre brillante y luminoso que alcanza las notas mas agudas con facilidad.",
    "Mezzosoprano": "La voz Mezzosoprano combina riqueza en el registro medio con capacidad expresiva unica, dominando tanto el drama como la sensualidad vocal.",
    "Contralto": "La Contralto es la voz femenina mas grave y escasa, con un timbre oscuro, profundo y de gran densidad sonora.",
    "Tenor": "La voz de Tenor destaca por su brillantez en los agudos y su capacidad de proyeccion emocional, siendo la voz masculina mas admirada en pop, rock y opera.",
    "Baritono": "El Baritono equilibra potencia y calidez, con graves resonantes y agudos accesibles. Es el tipo vocal masculino mas comun entre los grandes interpretes.",
    "Bajo": "La voz de Bajo transmite autoridad y profundidad, con un timbre oscuro e inconfundible que aporta una presencia imponente.",
}

HARDWARE = {
    "Soprano":      {"pro": "Neumann U87 Ai", "vers": "Audio-Technica AT4040"},
    "Mezzosoprano": {"pro": "AKG C414 XLII", "vers": "Rode NT1-A"},
    "Contralto":    {"pro": "Neumann U47", "vers": "Audio-Technica AT2035"},
    "Tenor":        {"pro": "Neumann U87 Ai", "vers": "LEWITT LCT 440 PURE"},
    "Baritono":     {"pro": "Shure SM7B", "vers": "Warm Audio WA-87 R2"},
    "Bajo":         {"pro": "AKG C414 XLII", "vers": "Rode NT2-A"},
}

def slug_from_id(db_id):
    s = db_id.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')

def normalize_vt(raw, slug):
    vt = VT_NORM.get(raw.lower().strip(), 'Baritono')
    vt_accented = vt.replace('Baritono', 'Bar\u00edtono')
    # Gender safety
    if vt_accented in FEMALE_TYPES and slug not in KNOWN_FEMALE:
        mapping = {"Soprano": "Tenor", "Mezzosoprano": "Bar\u00edtono", "Contralto": "Bajo"}
        return mapping.get(vt_accented, "Bar\u00edtono")
    return vt_accented

def build_page(name, slug, vt):
    hw = HARDWARE.get(vt.replace('\u00ed', 'i').replace('\u00e1', 'a'), HARDWARE["Baritono"])
    desc = VOICE_DESC.get(vt.replace('\u00ed', 'i').replace('\u00e1', 'a'), VOICE_DESC["Baritono"])
    canonical = f"{BASE_URL}{slug}/"
    title = f"{name} | Perfil Vocal V5 | Harmiq"
    meta_desc = f"Descubre el perfil vocal de {name}: tipo de voz {vt}, tecnicas de canto y equipo recomendado."

    return (
        '<!DOCTYPE html>'
        '<html lang="es"><head>'
        '<meta charset="UTF-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1.0">'
        f'<title>{title}</title>'
        f'<link rel="canonical" href="{canonical}">'
        '<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap" rel="stylesheet">'
        f'<meta name="description" content="{meta_desc}">'
        '<style>'
        ':root{--p:#7C4DFF;--a:#FF4FA3;--dark:#05040d;--card:#110f21;--t:#FFFFFF;--m:#8E8CA7;--glass:rgba(255,255,255,0.03);--glass-border:rgba(255,255,255,0.08)}'
        '*{margin:0;padding:0;box-sizing:border-box}'
        'body{font-family:Outfit,sans-serif;background:var(--dark);color:var(--t);min-height:100vh}'
        '.hero{max-width:700px;margin:0 auto;padding:2rem 1.5rem}'
        '.back{color:var(--m);font-size:.9rem;text-decoration:none;display:inline-block;margin-bottom:1.5rem}'
        '.back:hover{color:var(--p)}'
        '.card{background:var(--card);border:1px solid var(--glass-border);border-radius:16px;padding:2rem;margin-bottom:1.5rem}'
        'h1{font-size:2rem;font-weight:900;margin-bottom:.5rem}'
        '.vt{color:var(--p);font-weight:900;text-transform:uppercase;letter-spacing:2px;margin-bottom:1rem;font-size:.9rem}'
        '.bio{color:var(--m);font-size:1.05rem;line-height:1.7}'
        '.hw-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem}'
        '.hw-card{background:var(--glass);border:1px solid var(--glass-border);border-radius:12px;padding:1rem}'
        '.hw-label{color:var(--m);font-size:.8rem;margin-bottom:.3rem}'
        '.hw-name{font-weight:700;font-size:.95rem}'
        '.section-title{font-size:1.1rem;font-weight:700;margin-bottom:1rem;color:var(--t)}'
        '</style>'
        '</head>'
        '<body>'
        '<div class="hero">'
        '<a href="/artistas/" class="back">Directorio de artistas</a>'
        '<div class="card">'
        f'<h1>{name}</h1>'
        f'<div class="vt">{vt}</div>'
        f'<p class="bio">{desc}</p>'
        '</div>'
        '<div class="card">'
        '<div class="section-title">Equipo recomendado</div>'
        '<div class="hw-grid">'
        f'<div class="hw-card"><div class="hw-label">Nivel Pro</div><div class="hw-name">{hw["pro"]}</div></div>'
        f'<div class="hw-card"><div class="hw-label">Versatil</div><div class="hw-name">{hw["vers"]}</div></div>'
        '</div>'
        '</div>'
        '</div>'
        '</body></html>\n'
    )

# ── PASO 1: Añadir canonical a páginas existentes ───────────────────────────
print("PASO 1: Añadiendo canonical tags...")
canon_added = 0
canon_skip = 0

for slug in sorted(os.listdir(ARTISTAS_DIR)):
    html_path = os.path.join(ARTISTAS_DIR, slug, "index.html")
    if not os.path.exists(html_path):
        continue
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'rel="canonical"' in content or "rel='canonical'" in content:
        canon_skip += 1
        continue
    # Insert after </title>
    canonical_tag = f'<link rel="canonical" href="{BASE_URL}{slug}/">'
    new_content = content.replace('</title>', f'</title>{canonical_tag}', 1)
    if new_content != content:
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        canon_added += 1

print(f"  Canonical añadidos: {canon_added}")
print(f"  Ya tenian canonical: {canon_skip}")

# ── PASO 2: Generar nuevas páginas ──────────────────────────────────────────
print("\nPASO 2: Generando nuevas páginas de artistas...")

with open(DB_PATH, 'r', encoding='utf-8') as f:
    db = json.load(f)

existing_slugs = set(os.listdir(ARTISTAS_DIR))
new_count = 0
skip_count = 0

for singer in db['singers']:
    db_id = singer.get('id', '')
    name = singer.get('name', db_id)
    raw_vt = singer.get('voice_type', 'baritone')
    slug = slug_from_id(db_id)

    if slug in existing_slugs:
        skip_count += 1
        continue

    vt = normalize_vt(raw_vt, slug)
    artist_dir = os.path.join(ARTISTAS_DIR, slug)
    os.makedirs(artist_dir, exist_ok=True)
    html = build_page(name, slug, vt)
    with open(os.path.join(artist_dir, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(html)
    existing_slugs.add(slug)
    new_count += 1

print(f"  Paginas nuevas creadas: {new_count}")
print(f"  Ya existian: {skip_count}")
print(f"\nTotal artistas ahora: {len(existing_slugs)}")
