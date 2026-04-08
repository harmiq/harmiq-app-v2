"""
Regenera las páginas nuevas (sin template V5 completo) con el formato correcto.
Detecta páginas que NO tienen gadget-card (template simplificado) y las reescribe.
"""

import os, re, json, urllib.parse

ARTISTAS_DIR = r"E:\harmiq-app-final\cloudflare\artistas"
DB_PATH = r"E:\harmiq-app-final\harmiq_db_completa.json"

# ── Hardware por tipo vocal ──────────────────────────────────────────────────
VOCAL_HARDWARE = {
    "Tenor":        {"Pro": "Neumann U87 Ai",    "Versat": "LEWITT LCT 440 PURE"},
    "Bar\u00edtono":  {"Pro": "Shure SM7B",         "Versat": "Warm Audio WA-87 R2"},
    "Soprano":      {"Pro": "AKG C414 XLII",     "Versat": "Neumann TLM 103"},
    "Mezzosoprano": {"Pro": "Neumann TLM 102",   "Versat": "Aston Origin"},
    "Contralto":    {"Pro": "Shure KSM32",        "Versat": "Warm Audio WA-47jr"},
    "Bajo":         {"Pro": "Electro-Voice RE20", "Versat": "Rode NT2-A"},
}

VOCAL_GADGETS = [
    {"name": "Lax Vox (Terapia de Pajita)",
     "desc": "El 'must-have' para hidratar y relajar tus cuerdas vocales bajo el agua.",
     "link": "https://www.amazon.es/s?k=Lax+Vox+pajita+silicona+entrenamiento+vocal",
     "icon": "\U0001f964"},
    {"name": "Beltbox (M\u00e1scara Vocal)",
     "desc": "Calienta tu voz en cualquier lugar silenciando tu volumen un 90%.",
     "link": "https://www.amazon.es/s?k=Beltbox+vocal+dampener+mask",
     "icon": "\U0001f3ad"},
    {"name": "Nebulizador Vocal",
     "desc": "Hidrataci\u00f3n directa a trav\u00e9s de micro-part\u00edculas de suero salino.",
     "link": "https://www.amazon.es/s?k=Vocal+Mist+Nebulizador+portatil",
     "icon": "\U0001f4a8"},
]

DIET_YES = ["Agua (Temperatura Ambiente)", "T\u00e9 de Jengibre y Miel", "Frutas con Alto Contenido de Agua"]
DIET_NO  = ["L\u00e1cteos (Generan Mucosidad)", "Cafe\u00edna (Deshidrata)", "Picante (Reflujo G\u00e1strico)"]

VOICE_BIO = {
    "Soprano":      "Voz femenina m\u00e1s aguda, con un timbre brillante y luminoso capaz de alcanzar las notas m\u00e1s altas con facilidad y expresividad.",
    "Mezzosoprano": "Voz femenina intermedia con una riqueza \u00fanica en el registro medio, combinando profundidad y versatilidad expresiva.",
    "Contralto":    "La voz femenina m\u00e1s grave y escasa, con un timbre oscuro y denso de gran poder dram\u00e1tico.",
    "Tenor":        "La voz masculina m\u00e1s aguda y brillante, con una capacidad de proyecci\u00f3n emocional que la convierte en la m\u00e1s admirada del repertorio.",
    "Bar\u00edtono": "Voz masculina que equilibra potencia y calidez, con graves resonantes y agudos accesibles. El tipo vocal m\u00e1s com\u00fan entre grandes int\u00e9rpretes.",
    "Bajo":         "La voz masculina m\u00e1s grave, con un timbre oscuro e inconfundible que aporta autoridad y presencia \u00fanica.",
}

CSS = (":root{--p:#7C4DFF;--a:#FF4FA3;--dark:#05040d;--card:#110f21;--t:#FFFFFF;--m:#8E8CA7;"
       "--glass:rgba(255,255,255,0.03);--glass-border:rgba(255,255,255,0.08)}"
       "*{margin:0;padding:0;box-sizing:border-box}"
       "body{background:var(--dark);color:var(--t);font-family:'Outfit',sans-serif;line-height:1.6;overflow-x:hidden}"
       ".grad{background:linear-gradient(135deg,var(--p),var(--a));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}"
       "nav{display:flex;justify-content:space-between;align-items:center;padding:1.2rem 5%;"
       "background:rgba(5,4,13,0.9);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);"
       "position:sticky;top:0;z-index:1000;border-bottom:1px solid var(--glass-border)}"
       ".container{max-width:1100px;margin:0 auto;padding:4rem 5%}"
       ".hero{text-align:center;margin-bottom:5rem;position:relative}"
       ".hero-glow{position:absolute;top:-100px;left:50%;transform:translateX(-50%);"
       "width:350px;height:350px;background:var(--p);filter:blur(150px);opacity:0.15;z-index:-1}"
       ".artist-img{width:200px;height:200px;border-radius:40px;object-fit:cover;"
       "border:4px solid var(--glass-border);margin-bottom:1.5rem;box-shadow:0 30px 60px rgba(0,0,0,0.5)}"
       "h1{font-size:clamp(2.5rem,8vw,4.5rem);font-weight:900;letter-spacing:-0.05em;line-height:1;margin-bottom:1rem}"
       ".grid-v5{display:grid;grid-template-columns:1.5fr 1fr;gap:2rem}"
       ".card-v5{background:var(--glass);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);"
       "border:1px solid var(--glass-border);border-radius:32px;padding:2.5rem;margin-bottom:2rem}"
       ".hw-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.2rem;margin-top:1.5rem}"
       ".hw-item{background:rgba(255,255,255,0.02);padding:1.2rem;border-radius:20px;"
       "border:1px solid var(--glass-border);text-align:center}"
       ".hw-label{display:block;font-size:0.7rem;color:var(--a);font-weight:900;text-transform:uppercase;margin-bottom:0.4rem}"
       ".gadget-card{background:rgba(255,255,255,0.03);border-radius:24px;padding:1.5rem;"
       "display:flex;gap:1.2rem;margin-bottom:1rem;border:1px solid var(--glass-border);transition:0.3s}"
       ".gadget-card:hover{border-color:var(--p);transform:translateX(5px)}"
       ".gadget-icon{font-size:2rem}"
       ".amazon-btn{background:var(--p);color:#fff;text-decoration:none;padding:0.4rem 1rem;"
       "border-radius:50px;font-weight:800;font-size:0.8rem;display:inline-block;margin-top:0.8rem}"
       ".diet-box{background:linear-gradient(135deg,rgba(0,255,136,0.05),rgba(124,77,255,0.05));"
       "border-radius:24px;padding:2rem;border:1px solid rgba(0,255,136,0.1)}"
       ".diet-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-top:1rem}"
       ".diet-yes{color:#00FF88;font-weight:700;list-style:none}"
       ".diet-no{color:var(--a);font-weight:700;list-style:none}"
       ".song-card{display:flex;justify-content:space-between;padding:1rem;background:var(--glass);"
       "border-radius:15px;text-decoration:none;color:#fff;margin-bottom:0.6rem;font-weight:600}"
       ".song-card:hover{background:rgba(255,255,255,0.08)}"
       "@media(max-width:850px){.grid-v5{grid-template-columns:1fr}}")

# Wikipedia photo script (tries to load photo dynamically)
WIKI_SCRIPT = ("<script>"
               "(function(){"
               "var img=document.querySelector('.artist-img');"
               "if(!img)return;"
               "var name=img.getAttribute('data-name');"
               "fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(name))"
               ".then(function(r){return r.json()})"
               ".then(function(d){if(d.thumbnail&&d.thumbnail.source)img.src=d.thumbnail.source;})"
               ".catch(function(){});"
               "})();"
               "</script>")

def db_slug(db_id):
    return re.sub(r'[^a-z0-9]+', '-', db_id.lower()).strip('-')

def build_v5(name, slug, vt):
    hw = VOCAL_HARDWARE.get(vt, VOCAL_HARDWARE["Bar\u00edtono"])
    bio = VOICE_BIO.get(vt, VOICE_BIO["Bar\u00edtono"])
    canonical = f"https://harmiq.app/artistas/{slug}/"

    hw_html = (f'<div class="hw-item"><span class="hw-label">Nivel Pro</span>'
               f'<span class="hw-name">{hw["Pro"]}</span></div>'
               f'<div class="hw-item"><span class="hw-label">Home Studio</span>'
               f'<span class="hw-name">{hw["Versat"]}</span></div>')

    gadgets_html = "".join(
        f'<div class="gadget-card"><span class="gadget-icon">{g["icon"]}</span>'
        f'<div class="gadget-info"><h4>{g["name"]}</h4><p>{g["desc"]}</p>'
        f'<a href="{g["link"]}" target="_blank" class="amazon-btn">Ver en Amazon</a>'
        f'</div></div>' for g in VOCAL_GADGETS
    )

    songs_html = "".join(
        f'<a href="https://www.youtube.com/results?search_query={urllib.parse.quote(name + " " + s)}" '
        f'target="_blank" class="song-card"><span>{s}</span><span>&#9654;</span></a>'
        for s in ["Mejores canciones", "En vivo", "Grandes \u00e9xitos"]
    )

    diet_yes_html = "".join(f'<li>&#10003; {x}</li>' for x in DIET_YES)
    diet_no_html  = "".join(f'<li>&#10007; {x}</li>' for x in DIET_NO)

    return (
        '<!DOCTYPE html>'
        '<html lang="es"><head>'
        '<meta charset="UTF-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1.0">'
        f'<title>{name} | Perfil Vocal V5 | Harmiq</title>'
        f'<link rel="canonical" href="{canonical}">'
        '<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap" rel="stylesheet">'
        f'<meta name="description" content="Descubre el perfil vocal de {name}: tipo de voz {vt}, tecnica de canto y equipo recomendado para grabar.">'
        f'<style>{CSS}</style>'
        '</head><body>'
        '<nav><a href="/" class="grad" style="font-weight:900;font-size:1.6rem;text-decoration:none">Harmiq<span>Pro</span></a>'
        '<a href="/artistas" style="color:var(--m);text-decoration:none;font-weight:700">\u2190 VOLVER</a></nav>'
        '<div class="container">'
        '<div class="hero"><div class="hero-glow"></div>'
        f'<img src="/assets/img/vocal_placeholder.webp" data-name="{name}" class="artist-img" alt="{name}">'
        f'<div style="color:var(--p);font-weight:900;text-transform:uppercase;letter-spacing:2px;margin-bottom:0.5rem">{vt}</div>'
        f'<h1>{name}</h1>'
        '<p style="color:var(--m);font-weight:600">Bio-Hacking Vocal &amp; An\u00e1lisis de Equipo</p>'
        '</div>'
        '<div class="grid-v5">'
        '<div class="side-left">'
        '<div class="card-v5">'
        '<h3 style="margin-bottom:1rem">\U0001f9ec Perfil Biomec\u00e1nico</h3>'
        f'<p style="color:var(--m);font-size:1.1rem">{bio}</p>'
        f'<div class="hw-grid">{hw_html}</div>'
        '</div>'
        '<div class="diet-box"><h3>\U0001f957 Gu\u00eda de Nutrici\u00f3n Vocal</h3>'
        '<div class="diet-grid">'
        f'<ul class="diet-yes"><li style="color:#00FF88;font-size:0.7rem;text-transform:uppercase;margin-bottom:0.5rem">RECOMENDADO</li>{diet_yes_html}</ul>'
        f'<ul class="diet-no"><li style="color:var(--a);font-size:0.7rem;text-transform:uppercase;margin-bottom:0.5rem">EVITAR</li>{diet_no_html}</ul>'
        '</div></div>'
        '</div>'
        '<div class="side-right">'
        '<div class="card-v5">'
        f'<h3 style="margin-bottom:1.5rem">\U0001f9ea Vocal Bio-Hacking Kit</h3>{gadgets_html}</div>'
        '<div class="card-v5">'
        f'<h3 style="margin-bottom:1rem">\U0001f3b5 Mejores Interpretaciones</h3>{songs_html}</div>'
        '</div></div>'
        f'<div style="text-align:center;margin-top:5rem;padding:4rem;background:var(--glass);border-radius:40px;border:1px solid var(--glass-border)">'
        f'<h2>\u00bfQuieres saber si tu voz es como la de {name}?</h2>'
        '<a href="https://harmiq.app#analizar" style="background:linear-gradient(135deg,var(--p),var(--a));color:#fff;text-decoration:none;padding:1.2rem 2.5rem;border-radius:100px;font-weight:900;display:inline-block;margin-top:2rem;box-shadow:0 15px 30px rgba(124,77,255,0.3)">ESCANEAR MI VOZ</a>'
        '</div>'
        '</div>'
        f'{WIKI_SCRIPT}'
        '</body></html>\n'
    )

# ── Normalización tipo vocal ─────────────────────────────────────────────────
VT_NORM = {
    'soprano': 'Soprano', 'mezzo-soprano': 'Mezzosoprano', 'mezzosoprano': 'Mezzosoprano',
    'contralto': 'Contralto', 'tenor': 'Tenor', 'baritone': 'Bar\u00edtono',
    'baritono': 'Bar\u00edtono', 'bass-baritone': 'Bar\u00edtono', 'bass': 'Bajo',
    'bajo': 'Bajo', 'countertenor': 'Tenor',
}
KNOWN_FEMALE = {
    "adele","ariana-grande","beyonce","billie-eilish","celine-dion","dua-lipa",
    "ella-fitzgerald","katy-perry","lady-gaga","lana-del-rey","madonna",
    "mariah-carey","nina-simone","norah-jones","olivia-rodrigo","sabrina-carpenter",
    "shakira","taylor-swift","whitney-houston","anne-marie","aitana","karol-g",
    "melanie-martinez","rosalia","rihanna","sza","camila-cabello","selena-gomez",
    "jennifer-lopez","gloria-estefan","amy-winehouse","iu","taeyeon",
}
FEMALE_VT = {"Soprano", "Mezzosoprano", "Contralto"}

def normalize_vt(raw, slug):
    vt = VT_NORM.get(raw.lower().strip(), 'Bar\u00edtono')
    if vt in FEMALE_VT and slug not in KNOWN_FEMALE:
        return {"Soprano": "Tenor", "Mezzosoprano": "Bar\u00edtono", "Contralto": "Bajo"}.get(vt, "Bar\u00edtono")
    return vt

# ── Main ─────────────────────────────────────────────────────────────────────
print("Cargando DB...")
with open(DB_PATH, 'r', encoding='utf-8') as f:
    db = json.load(f)

db_map = {db_slug(s['id']): s for s in db['singers']}
print(f"DB: {len(db_map)} artistas")

fixed = 0
skipped = 0

for slug in os.listdir(ARTISTAS_DIR):
    html_path = os.path.join(ARTISTAS_DIR, slug, "index.html")
    if not os.path.exists(html_path):
        continue

    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Solo reescribir páginas sin el template completo V5
    if 'gadget-card' in content and 'grid-v5' in content:
        skipped += 1
        continue

    # Obtener datos del artista
    singer = db_map.get(slug)
    if singer:
        name = singer.get('name', slug.replace('-', ' ').title())
        raw_vt = singer.get('voice_type', 'baritone')
        vt = normalize_vt(raw_vt, slug)
    else:
        name = slug.replace('-', ' ').title()
        vt = 'Bar\u00edtono'

    html = build_v5(name, slug, vt)
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    fixed += 1

print(f"Regeneradas con V5 completo: {fixed}")
print(f"Ya tenian V5 completo (sin tocar): {skipped}")
