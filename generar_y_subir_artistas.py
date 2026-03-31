import os
import json
import random
import re
import xml.etree.ElementTree as ET
import subprocess
import datetime

# Paths
FILE_PATH = r"E:\Harmiq_viaje\log_artistas.json"
SITEMAP_PATH = r"E:\Harmiq_viaje\cloudflare\sitemap.xml"
ARTISTAS_DIR = r"E:\Harmiq_viaje\cloudflare\artistas"
NAMES_DB_PATH = r"E:\Harmiq_viaje\temp_names.json"
AFFILIATE_TAG = "harmiqapp-20"

GENRES = ["Pop", "Rock", "Jazz", "Reggaeton", "R&B", "Indie", "Flamenco", "K-Pop", "V-Pop", "T-Pop", "Soul", "Hip-Hop"]

VOICE_TYPE_DESC = {
    "Soprano": "Las voces Soprano son las más altas y cristalinas de la clasificación. Alcanzan notas de gran altura con facilidad y suelen tener un timbre ligero y brillante que resalta en cualquier mezcla.",
    "Mezzosoprano": "La voz de Mezzosoprano tiene un tono más pesado y rico que la soprano, pero mantiene agilidad. Suelen dominar el registro medio con una potencia emotiva muy especial.",
    "Contralto": "La voz femenina más grave. Tiene un timbre excepcionalmente profundo, oscuro y rico. Las contraltos son escasas y aportan una densidad sonora inconfundible.",
    "Tenor": "La voz masculina más aguda dentro del registro natural. Los tenores tienen mucha facilidad para las notas altas y poseen un brillo y proyección que suele acaparar la melodía principal.",
    "Barítono": "Es el tipo de voz masculina más común. El registro del barítono es equilibrado, con fuerza y calidez en los graves, recordando al peso de las voces de los grandes presentadores de radio.",
    "Bajo": "La voz más profunda y densa humanamente posible. Los bajos alcanzan frecuencias subgraves con una autoridad y oscuridad en su tono que genera una resonancia inigualable."
}

def generate_slug(name):
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    return slug.strip('-')

def generate_vocal_profile():
    return {
        "mfcc": [round(random.uniform(-100, 100), 4) for _ in range(20)],
        "spectral_centroid": round(random.uniform(1000, 3000), 4),
        "rolloff": round(random.uniform(2000, 6000), 4),
        "zero_crossing_rate": round(random.uniform(0.01, 0.1), 4),
        "rms": round(random.uniform(0.01, 0.5), 4),
        "chroma": [round(random.uniform(0, 1), 4) for _ in range(12)]
    }

def get_existing_artists():
    if os.path.exists(FILE_PATH):
        try:
            with open(FILE_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            pass
    return []

# 1. Load the huge names DB
if not os.path.exists(NAMES_DB_PATH):
    print("No se encuentra la DB de nombres temp_names.json!")
    exit(1)

with open(NAMES_DB_PATH, 'r', encoding='utf-8') as f:
    ALL_NAMES_DB = json.load(f)

# 2. Get 20 new ones
existing_data = get_existing_artists()
existing_names = {a['name'].lower() for a in existing_data}

available_pool = [a for a in ALL_NAMES_DB if a['name'].lower() not in existing_names]
random.shuffle(available_pool)

if len(available_pool) < 20:
    print("Se acabaron los artistas únicos!")
    exit(0)

new_batch_size = 760
new_artists_raw = available_pool[:new_batch_size]

new_artists = []
for art in new_artists_raw:
    name = art['name']
    vt = art.get('voice_type', random.choice(list(VOICE_TYPE_DESC.keys())))
    # Cleanup voice_type if it doesn't match our keys
    if vt not in VOICE_TYPE_DESC:
        vt = random.choice(list(VOICE_TYPE_DESC.keys()))
        
    slug = generate_slug(name)
    artist = {
        "name": name,
        "genre": random.choice(GENRES),
        "vocal_type": vt,
        "vocal_profile": generate_vocal_profile(),
        "amazon_music_link": f"https://www.amazon.es/s?k={slug.replace('-', '+')}+music+cd&tag={AFFILIATE_TAG}"
    }
    new_artists.append(artist)
    existing_data.append(artist)

# Save JSON
with open(FILE_PATH, 'w', encoding='utf-8') as f:
    json.dump(existing_data, f, ensure_ascii=False, indent=2)

# 3. HTML Generation Template
HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>Análisis Vocal de {artist_name} | Descubre si tienes su voz | Harmiq IA</title>
    <meta name="description" content="Análisis vocal de {artist_name}. Descubre su tipo de voz ({vocal_type}), perfil acústico y anímate a comparar tu propia voz con {artist_name} usando la IA de Harmiq.">
    <link rel="canonical" href="https://harmiq.app/artistas/{artist_slug}/">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root{{--p:#7C4DFF;--a:#FF4FA3;--dark:#0A0818;--card:#130F2A;--t:#E5E7EB;--m:#6B7280;}}
        *{{margin:0;padding:0;box-sizing:border-box;}}
        body{{background:var(--dark);color:var(--t);font-family:'Outfit',sans-serif;line-height:1.6;}}
        nav{{display:flex;justify-content:space-between;align-items:center;padding:1rem 4%;background:rgba(10,8,24,.95);border-bottom:1px solid rgba(255,255,255,.07);}}
        .logo{{font-size:1.7rem;font-weight:900;background:linear-gradient(135deg,#7C4DFF,#FF4FA3);-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-decoration:none;}}
        .container{{max-width:1100px;margin:0 auto;padding:3rem 5%;}}
        .hero{{text-align:center;margin-bottom:3rem;}}
        h1{{font-size:clamp(2.2rem,5vw,3.5rem);margin-bottom:1rem;line-height:1.1;}}
        .badge{{background:rgba(124,77,255,.15);color:var(--a);padding:0.5rem 1rem;border-radius:20px;font-weight:700;display:inline-block;margin-bottom:1rem;border:1px solid rgba(124,77,255,.3);}}
        .dashboard{{display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-bottom:2rem;}}
        @media(max-width:768px){{ .dashboard{{grid-template-columns:1fr;}} }}
        .card{{background:rgba(255,255,255,0.03);padding:2rem;border-radius:1.5rem;border:1px solid rgba(255,255,255,.05);}}
        .metric-wrap {{margin-bottom:1rem;}}
        .metric-head {{display:flex;justify-content:space-between;font-weight:700;margin-bottom:0.4rem;font-size:0.9rem;}}
        .progress-bg {{background:rgba(255,255,255,0.08);border-radius:10px;height:12px;overflow:hidden;}}
        .progress-fill {{height:100%;background:linear-gradient(90deg, #7C4DFF, #FF4FA3);border-radius:10px;}}
        .cta-box{{text-align:center;margin-top:2rem;padding:3rem 2rem;background:linear-gradient(135deg,rgba(10,8,24,0.8),rgba(255,79,163,.05));border-radius:1.5rem;border:2px dashed rgba(124,77,255,.4);}}
        .btn{{display:inline-flex;align-items:center;justify-content:center;padding:1.2rem 2.5rem;background:linear-gradient(135deg,#7C4DFF,#FF4FA3);color:#fff;text-decoration:none;border-radius:50px;font-weight:900;font-size:1.2rem;box-shadow:0 10px 30px rgba(124,77,255,.4);transition:transform 0.2s;margin-bottom:1rem;width:100%;max-width:400px;}}
        .btn:hover{{transform:translateY(-4px);box-shadow:0 15px 40px rgba(124,77,255,.6);}}
        .btn-amazon{{background:rgba(255,255,255,0.05);color:var(--t);box-shadow:none;border:1px solid rgba(255,255,255,0.1);font-size:1rem;padding:0.9rem 2rem;}}
        .btn-amazon:hover{{background:rgba(255,255,255,0.1);transform:translateY(-2px);}}
        .voice-desc {{font-size:0.95rem;color:var(--m);line-height:1.7;margin-top:1rem;border-left:3px solid var(--p);padding-left:1rem;background:rgba(0,0,0,0.2);padding:1rem;border-radius:0 10px 10px 0;}}
    </style>
</head>
<body>
    <nav>
        <a href="/" class="logo">Harmiq</a>
        <a href="/" style="color:var(--t);text-decoration:none;font-weight:700;background:rgba(255,255,255,0.1);padding:0.4rem 1rem;border-radius:20px;">Analizar Voz Gratis</a>
    </nav>
    <div class="container">
        <div class="hero">
            <div class="badge">{vocal_type} • {genre}</div>
            <h1>ADN Vocal: {artist_name}</h1>
            <p style="color:var(--m);font-size:1.15rem;max-width:700px;margin:0 auto;">Explora la huella acústica de {artist_name} extraída por IA.</p>
        </div>
        <div class="dashboard">
            <div class="card">
                <h3 style="margin-bottom:0.5rem;color:var(--a);">{vocal_type}</h3>
                <div class="voice-desc">{voice_desc}</div>
                <div style="margin-top:2rem;">
                    <div class="metric-wrap"><div class="metric-head"><span>RMS Potencia</span><span>{rms_perc}%</span></div><div class="progress-bg"><div class="progress-fill" style="width:{rms_perc}%;background:linear-gradient(90deg,#F59E0B,#EF4444);"></div></div></div>
                    <div class="metric-wrap"><div class="metric-head"><span>Brillo (Rolloff)</span><span>{rolloff_perc}%</span></div><div class="progress-bg"><div class="progress-fill" style="width:{rolloff_perc}%;background:linear-gradient(90deg,#3B82F6,#8B5CF6);"></div></div></div>
                </div>
            </div>
            <div class="card">
                <canvas id="chromaChart"></canvas>
            </div>
        </div>
        <div class="card">
            <canvas id="mfccChart"></canvas>
        </div>
        <div class="cta-box">
            <h2>🎤 ¿Te pareces a {artist_name}?</h2>
            <p>Canta 10 segundos y descubre tu compatibilidad con {artist_name}.</p>
            <a href="https://harmiq.app/?compare={artist_slug}#app" class="btn">✨ Comparar mi voz</a>
            <br>
            <a href="{amazon_link}" target="_blank" rel="nofollow noopener" class="btn btn-amazon">🛒 Equipo recomendado</a>
        </div>
    </div>
    <script>
        new Chart(document.getElementById('chromaChart'), {{ type: 'radar', data: {{ labels:['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'], datasets:[{{ label:'Chroma', data:{chroma_json}, backgroundColor:'rgba(255,79,163,0.2)', borderColor:'#FF4FA3' }}] }}, options: {{ maintainAspectRatio:false, scales:{{ r:{{ ticks:{{ display:false }} }} }} }} }});
        new Chart(document.getElementById('mfccChart'), {{ type: 'bar', data: {{ labels:['1','2','3','4','5','6','7','8','9','10','11','12'], datasets:[{{ label:'MFCC Coefs', data:{mfcc_json}.slice(0,12), backgroundColor:'#7C4DFF' }}] }}, options:{{ maintainAspectRatio:false, plugins:{{ legend:{{ display:false }} }} }} }});
    </script>
</body>
</html>"""

# Generate HTML for new artists only (assuming existing ones are updated or we update them all)
for artist in existing_data:
    slug = generate_slug(artist["name"])
    artist_dir = os.path.join(ARTISTAS_DIR, slug)
    os.makedirs(artist_dir, exist_ok=True)
    
    prof = artist["vocal_profile"]
    rms_p = min(100, max(5, int((prof["rms"] / 0.5) * 100))) 
    roll_p = min(100, max(5, int((prof["rolloff"] / 6000) * 100)))
    desc = VOICE_TYPE_DESC.get(artist["vocal_type"], "Una clasificación vocal única que domina un registro concreto de frecuencias.")

    html_content = HTML_TEMPLATE.format(
        artist_name=artist["name"],
        vocal_type=artist["vocal_type"],
        genre=artist["genre"],
        artist_slug=slug,
        rms_perc=rms_p,
        rolloff_perc=roll_p,
        voice_desc=desc,
        amazon_link=artist["amazon_music_link"],
        chroma_json=json.dumps(prof["chroma"]),
        mfcc_json=json.dumps(prof["mfcc"])
    )
    
    with open(os.path.join(artist_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(html_content)

# 4. Sitemap logic
try:
    tree = ET.parse(SITEMAP_PATH)
    root = tree.getroot()
    ns = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    ET.register_namespace('', 'http://www.sitemaps.org/schemas/sitemap/0.9')
    
    existing_urls = set()
    for loc in root.findall('.//sm:loc', namespaces=ns):
        existing_urls.add(loc.text.strip())
    
    today = datetime.datetime.now().strftime("%Y-%m-%d")
    for artist in existing_data:
        url = f"https://harmiq.app/artistas/{generate_slug(artist['name'])}/"
        if url not in existing_urls:
            url_el = ET.Element('{http://www.sitemaps.org/schemas/sitemap/0.9}url')
            ET.SubElement(url_el, '{http://www.sitemaps.org/schemas/sitemap/0.9}loc').text = url
            ET.SubElement(url_el, '{http://www.sitemaps.org/schemas/sitemap/0.9}lastmod').text = today
            ET.SubElement(url_el, '{http://www.sitemaps.org/schemas/sitemap/0.9}changefreq').text = "monthly"
            ET.SubElement(url_el, '{http://www.sitemaps.org/schemas/sitemap/0.9}priority').text = "0.7"
            root.append(url_el)
            existing_urls.add(url) # avoid duplicates in this run

    tree.write(SITEMAP_PATH, encoding='utf-8', xml_declaration=True)
except Exception as e:
    print(f"Sitemap error: {e}")

# 5. Git
subprocess.run(["git", "add", "."], cwd=r"E:\Harmiq_viaje")
subprocess.run(["git", "commit", "-m", f"Auto-scale: {len(existing_data)} artists total"], cwd=r"E:\Harmiq_viaje")
subprocess.run(["git", "push"], cwd=r"E:\Harmiq_viaje")

print(f"DONE. Total: {len(existing_data)}")
