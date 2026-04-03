import os, re, json, time, urllib.request, urllib.parse

ARTISTAS_DIR = r"E:\Harmiq_viaje\cloudflare\artistas"
CACHE_PATH = r"E:\Harmiq_viaje\itunes_img_cache.json"

# ===========================================================================
# 🎤 DICCIONARIO DE HARDWARE RECOMENDADO POR TIPO VOCAL
# ===========================================================================
VOCAL_HARDWARE = {
    "Tenor": {
        "Pro": "Neumann U87 Ai",
        "Versatil": "LEWITT LCT 440 PURE",
        "Budget": "Audio-Technica AT2020",
        "Reasoning": "Ideal para capturar la claridad y los agudos brillantes de los tenores."
    },
    "Barítono": {
        "Pro": "Shure SM7B",
        "Versatil": "Warm Audio WA-87 R2",
        "Budget": "Rode NT1 5th Gen",
        "Reasoning": "Excelente para dar calidez y cuerpo a los registros medios y graves."
    },
    "Soprano": {
        "Pro": "AKG C414 XLII",
        "Versatil": "Neumann TLM 103",
        "Budget": "Sennheiser MK4",
        "Reasoning": "Diseñados para manejar la potencia de agudos sin sacrificar suavidad."
    },
    "Mezzosoprano": {
        "Pro": "Neumann TLM 102",
        "Versatil": "Aston Microphones Origin",
        "Budget": "AKG P420",
        "Reasoning": "Captura la riqueza tonal y versatilidad de las mezzosopranos con detalle."
    },
    "Contralto": {
        "Pro": "Shure KSM32",
        "Versatil": "Warm Audio WA-47jr",
        "Budget": "Behringer B-2 Pro",
        "Reasoning": "Resalta la profundidad y densidad única de la voz de contralto."
    },
    "Bajo": {
        "Pro": "Electro-Voice RE20",
        "Versatil": "Rode NT2-A",
        "Budget": "MXL 990",
        "Reasoning": "Perfecto para capturar frecuencias graves sin el efecto de proximidad excesivo."
    }
}

# ===========================================================================
# 🎨 DICCIONARIO DE CURSOS (HARMIQ ACADEMY)
# ===========================================================================
HARMIQ_COURSES = [
    {
        "id": "domina-vocal",
        "title": "Domina tu Tipo Vocal: {vocal_type}",
        "desc": "Aprende las técnicas que usan los profesionales para potenciar su tesitura natural.",
        "icon": "🎓"
    },
    {
        "id": "mezcla-vocal",
        "title": "Producción y Mezcla de Voces",
        "desc": "Secretos de estudio para que tus grabaciones suenen al nivel de {artist_name}.",
        "icon": "🎚️"
    }
]

# ===========================================================================
# BASE DE DATOS (Importada de v3 para compatibilidad)
# ===========================================================================
VERIFIED_ARTISTS = {
    "bad-bunny": ("Barítono", "Bad Bunny posee una voz de barítono, caracterizada por un tono grave, áspero y una gran maleabilidad.", ["Tití Me Preguntó", "Me Porto Bonito", "Dákiti", "Booker T", "Yonaguni"]),
    "j-balvin": ("Barítono", "J Balvin tiene una voz de barítono con un timbre cálido y versátil.", ["Mi Gente", "LA CANCIÓN", "Ay Vamos", "Safari", "Morado"]),
    "maluma": ("Tenor", "Maluma posee una voz de tenor con un timbre suave y melódico.", ["Hawái", "Felices los 4", "Sobrio", "Corazón", "Borro Cassette"]),
    "justin-bieber": ("Tenor", "Justin Bieber es un tenor lírico ligero con un timbre brillante y juvenil.", ["Baby", "Sorry", "Love Yourself", "Peaches", "Ghost"]),
    "michael-jackson": ("Tenor", "Michael Jackson poseía una voz de tenor alto con un rango de casi 4 octavas.", ["Billie Jean", "Beat It", "Thriller", "Smooth Criminal", "Man in the Mirror"]),
    "elvis-presley": ("Barítono", "Elvis Presley poseía una voz de barítono alto con un rango excepcional de casi 3 octavas.", ["Can't Help Falling in Love", "Jailhouse Rock", "Suspicious Minds", "Hound Dog", "Heartbreak Hotel"]),
    "freddie-mercury": ("Tenor", "Freddie Mercury poseía una voz de tenor con un rango vocal extraordinario.", ["Bohemian Rhapsody", "Don't Stop Me Now", "Somebody to Love", "Under Pressure", "We Are the Champions"]),
    "frank-sinatra": ("Barítono", "Frank Sinatra es considerado el barítono lírico ligero por excelencia del pop.", ["My Way", "Fly Me to the Moon", "That's Life", "New York, New York", "Strangers in the Night"]),
    "shakira": ("Mezzosoprano", "Shakira posee un timbre único y técnicas distintivas que enriquecen su tono mezzo.", ["Hips Don't Lie", "Waka Waka", "TQG", "La Tortura", "Suerte"]),
    "adele": ("Mezzosoprano", "Adele posee una voz de mezzosoprano con profundo tono soul y emotividad inigualable.", ["Someone Like You", "Hello", "Rolling in the Deep", "Set Fire to the Rain", "Easy On Me"]),
    "rosal-a": ("Soprano", "Rosalía es una soprano lírica con una técnica excepcional que fusiona el flamenco con el pop contemporáneo.", ["DESPECHÁ", "SAOKO", "Malamente", "Candy", "Bizcochito"]),
    "c-tangana": ("Barítono", "C. Tangana posee una voz de barítono con estilo grave.", ["Tú Me Dejaste De Querer", "Demasiadas Mujeres", "Ateo", "Llorando en la Limo", "Mala Mujer"]),
}

def load_cache():
    if os.path.exists(CACHE_PATH):
        try:
            with open(CACHE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return {}
    return {}

IMG_CACHE = load_cache()

def get_artist_image_final(slug, artist_name):
    if artist_name in IMG_CACHE:
        return IMG_CACHE[artist_name]
    local_abs = os.path.join(r"E:\Harmiq_viaje\assets\img", f"{slug}.webp")
    if os.path.exists(local_abs):
        return f"/assets/img/{slug}.webp"
    return f"https://images.placeholders.dev/?width=600&height=600&text={urllib.parse.quote(artist_name)}&background=130F2A&color=ffffff"

def upgrade_html_v4(html_path, slug, vocal_type, bio_text, songs, artist_img):
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()

    m_name = re.search(r'<h1>(.*?)</h1>', content)
    artist_name = m_name.group(1).strip() if m_name else slug.replace("-", " ").title()
    
    m_genre = re.search(r'class="badge">.*? \u2022 (.*?)</div>', content)
    genre = m_genre.group(1).strip() if m_genre else "Pop/Rock"

    # Seleccionar Hardware
    hw = VOCAL_HARDWARE.get(vocal_type, VOCAL_HARDWARE["Tenor"])
    hw_html = f'''
        <div class="hw-grid">
            <div class="hw-item">
                <span class="hw-label">Nivel Pro</span>
                <span class="hw-name">{hw["Pro"]}</span>
            </div>
            <div class="hw-item">
                <span class="hw-label">Versátil</span>
                <span class="hw-name">{hw["Versatil"]}</span>
            </div>
            <div class="hw-item">
                <span class="hw-label">Budget</span>
                <span class="hw-name">{hw["Budget"]}</span>
            </div>
        </div>
        <p class="hw-desc">{hw["Reasoning"]}</p>
    '''

    # Seleccionar Cursos
    courses_html = ""
    for c in HARMIQ_COURSES:
        c_title = c["title"].format(vocal_type=vocal_type)
        c_desc = c["desc"].format(artist_name=artist_name)
        courses_html += f'''
            <div class="course-card">
                <div class="course-icon">{c["icon"]}</div>
                <div class="course-info">
                    <h4>{c_title}</h4>
                    <p>{c_desc}</p>
                    <a href="https://harmiq.app/academy/{c["id"]}" class="course-btn">Ver curso</a>
                </div>
            </div>
        '''

    # Rescatar gráficos (simplificado para v4)
    m_chroma = re.search(r"data:\s*\[([\d\.\,\s]+)\]\s*,.*?backgroundColor:\s*'rgba", content, re.DOTALL)
    chroma_data = m_chroma.group(1).strip() if m_chroma else "0.8, 0.4, 0.6, 0.9, 0.2, 0.5, 0.7, 0.3, 0.1, 0.6, 0.8, 0.4"
    
    m_mfcc = re.search(r"data:\s*\[([^\]]+)\].*?borderColor:\s*'#", content, re.DOTALL)
    mfcc_data = m_mfcc.group(1).strip() if m_mfcc else "10,20,-10,5,0,-5,10,15,5,0,0,5,10,2,3,-1,-10,0,5,2"

    songs_html = "".join([f'<a href="https://www.youtube.com/results?search_query={urllib.parse.quote(f"{artist_name} {s}")}" target="_blank" class="song-card"><span class="song-num">{i+1}</span><span class="song-title">{s}</span><span class="song-icon">▶</span></a>' for i, s in enumerate(songs)])

    new_html = f'''<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>Análisis Vocal: {artist_name} | {vocal_type} | Harmiq Pro</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root{{--p:#7C4DFF;--a:#FF4FA3;--dark:#05050A;--card:#101018;--t:#FFFFFF;--m:#94A3B8;--bg-grad:radial-gradient(circle at 50% 0%, #1A1A2E 0%, #05050A 100%);}}
        *{{margin:0;padding:0;box-sizing:border-box;}}
        body{{background:var(--dark);background-image:var(--bg-grad);color:var(--t);font-family:'Outfit',sans-serif;line-height:1.6;overflow-x:hidden;}}
        
        nav{{display:flex;justify-content:space-between;align-items:center;padding:1.5rem 5%;background:rgba(5,5,10,0.8);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.05);position:sticky;top:0;z-index:100;}}
        .logo{{font-size:1.8rem;font-weight:900;text-decoration:none;color:#fff;letter-spacing:-1px;}}
        .logo span{{background:linear-gradient(135deg, #7C4DFF, #FF4FA3);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}}
        
        .container{{max-width:1200px;margin:0 auto;padding:4rem 5%;}}
        
        .hero{{text-align:center;margin-bottom:6rem;position:relative;}}
        .hero-glow{{position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:400px;height:400px;background:var(--p);filter:blur(150px);opacity:0.2;z-index:-1;}}
        
        .artist-img {{
            width:220px;height:220px;border-radius:50%;object-fit:cover;
            border:8px solid rgba(255,255,255,0.03);
            box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);
            margin-bottom:2rem;
            transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }}
        .artist-img:hover {{transform:scale(1.05) rotate(2deg);}}
        
        h1{{font-size:clamp(3rem,8vw,5rem);font-weight:900;letter-spacing:-2px;line-height:0.9;margin-bottom:1.5rem;background:linear-gradient(to bottom, #fff, #94A3B8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}}
        .vocal-badge{{display:inline-block;padding:0.6rem 1.5rem;background:rgba(124,77,255,0.1);border:1px solid rgba(124,77,255,0.2);border-radius:100px;color:var(--p);font-weight:700;text-transform:uppercase;font-size:0.9rem;letter-spacing:1px;margin-bottom:1rem;}}

        .grid-main {{display:grid;grid-template-columns:1.6fr 1fr;gap:2.5rem;margin-bottom:4rem;}}
        @media(max-width:968px){{.grid-main{{grid-template-columns:1fr;}}}}
        
        .card{{background:var(--card);border:1px solid rgba(255,255,255,0.05);border-radius:2rem;padding:2.5rem;position:relative;overflow:hidden;}}
        .card h3{{font-weight:900;font-size:1.5rem;margin-bottom:1.5rem;display:flex;align-items:center;gap:12px;}}
        
        .bio-text {{font-size:1.2rem;color:var(--m);line-height:1.8;}}
        
        /* HARDWARE SECTION */
        .hw-grid {{display:grid;grid-template-columns:repeat(3, 1fr);gap:1rem;margin-top:1rem;}}
        .hw-item {{background:rgba(255,255,255,0.03);padding:1.2rem;border-radius:1.2rem;border:1px solid rgba(255,255,255,0.05);text-align:center;}}
        .hw-label {{display:block;font-size:0.7rem;color:var(--p);font-weight:800;text-transform:uppercase;margin-bottom:0.4rem;}}
        .hw-name {{display:block;font-weight:700;font-size:0.95rem;}}
        .hw-desc {{margin-top:1.5rem;font-size:0.9rem;color:var(--m);font-style:italic;text-align:center;}}

        /* ACADEMY SECTION */
        .academy-section {{margin-top:6rem;}}
        .academy-header {{text-align:center;margin-bottom:3rem;}}
        .academy-grid {{display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:2rem;}}
        .course-card {{background:linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%); border:1px solid rgba(255,255,255,0.08); border-radius:1.5rem; padding:2rem; display:flex; gap:1.5rem; transition:0.3s;}}
        .course-card:hover {{transform:translateY(-10px); border-color:var(--p);}}
        .course-icon {{font-size:2.5rem;}}
        .course-info h4{{font-size:1.2rem;margin-bottom:0.5rem;}}
        .course-info p{{font-size:0.9rem;color:var(--m);margin-bottom:1.2rem;}}
        .course-btn{{text-decoration:none;color:var(--p);font-weight:800;font-size:0.85rem;text-transform:uppercase;border:1px solid var(--p);padding:0.5rem 1.2rem;border-radius:50px;transition:0.2s;}}
        .course-btn:hover{{background:var(--p);color:#fff;}}

        .song-card{{display:flex;align-items:center;padding:1rem;background:rgba(255,255,255,0.03);border-radius:1rem;text-decoration:none;color:#fff;margin-bottom:0.8rem;transition:0.2s;}}
        .song-card:hover{{background:rgba(124,77,255,0.1);padding-left:1.5rem;}}
        .song-num{{color:var(--p);font-weight:900;width:30px;}}
        .song-title{{flex:1;font-weight:600;}}

        .cta-footer{{text-align:center;padding:6rem 2rem;background:var(--p);border-radius:3rem;margin-top:6rem;position:relative;overflow:hidden;}}
        .cta-footer h2{{font-size:3rem;font-weight:900;margin-bottom:1.5rem;}}
        .btn-main {{display:inline-block;padding:1.5rem 3.5rem;background:#fff;color:var(--p);text-decoration:none;border-radius:100px;font-weight:900;font-size:1.2rem;box-shadow:0 20px 40px rgba(0,0,0,0.2);transition:0.3s;}}
        .btn-main:hover {{transform:scale(1.05);box-shadow:0 30px 60px rgba(0,0,0,0.3);}}
    </style>
</head>
<body>
    <nav>
        <a href="/" class="logo">HARMIQ<span>PRO</span></a>
        <div style="display:flex;gap:20px;">
            <a href="/artistas" style="color:#fff;text-decoration:none;font-weight:600;">Directorio</a>
            <a href="https://harmiq.app/academy" style="color:var(--a);text-decoration:none;font-weight:700;">ACADEMY</a>
        </div>
    </nav>

    <div class="container">
        <div class="hero">
            <div class="hero-glow"></div>
            <img src="{artist_img}" class="artist-img" alt="{artist_name}">
            <div class="vocal-badge">{vocal_type}</div>
            <h1>{artist_name}</h1>
            <p style="color:var(--m);font-size:1.3rem;font-weight:600;">Análisis Biomecánico de Harmiq Pro AI</p>
        </div>

        <div class="grid-main">
            <div class="card">
                <h3>🧬 Perfil Bio-Acústico</h3>
                <p class="bio-text">{bio_text}</p>
                <div style="margin-top:2.5rem;">
                    <h3 style="font-size:1.1rem;color:var(--p);">🎙️ Recomendaciones de Equipamiento</h3>
                    {hw_html}
                </div>
            </div>
            
            <div class="card">
                <h3>📊 Huella Armónica</h3>
                <div style="height:280px;"><canvas id="chromaChart"></canvas></div>
                <div style="margin-top:2rem;">
                    <h3>🎵 Temas Analizados</h3>
                    {songs_html}
                </div>
            </div>
        </div>

        <div class="academy-section">
            <div class="academy-header">
                <h2 style="font-size:2.5rem;font-weight:900;">Harmiq <span style="color:var(--p)">Academy</span></h2>
                <p style="color:var(--m)">Cursos premium basados en el análisis de las estrellas</p>
            </div>
            <div class="academy-grid">
                {courses_html}
            </div>
        </div>

        <div class="cta-footer">
            <div style="position:absolute;top:-50px;left:-50px;width:200px;height:200px;background:rgba(255,255,255,0.1);border-radius:50%;filter:blur(50px);"></div>
            <h2>¿Quieres sonar como {artist_name}?</h2>
            <p style="font-size:1.3rem;margin-bottom:3rem;opacity:0.9;">Analiza tu voz gratis y descubre tu potencial oculto.</p>
            <a href="https://harmiq.app#analizar" class="btn-main">¡EMPEZAR ANÁLISIS YA!</a>
        </div>
    </div>

    <script>
        const ctx = document.getElementById('chromaChart');
        new Chart(ctx, {{
            type: 'radar',
            data: {{
                labels: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
                datasets: [{{
                    label: 'Espectro Armónico',
                    data: [{chroma_data}],
                    backgroundColor: 'rgba(124, 77, 255, 0.2)',
                    borderColor: '#7C4DFF',
                    pointRadius: 0,
                    borderWidth: 3
                }}]
            }},
            options: {{
                maintainAspectRatio:false,
                scales: {{
                    r: {{
                        grid: {{ color: 'rgba(255,255,255,0.05)' }},
                        angleLines: {{ color: 'rgba(255,255,255,0.05)' }},
                        ticks: {{ display: false }}
                    }}
                }},
                plugins: {{ legend: {{ display: false }} }}
            }}
        }});
    </script>
</body>
</html>'''

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_html)
    return True

if __name__ == "__main__":
    print("🚀 INICIANDO ACTUALIZACIÓN HARMIQ PRO V4...")
    count = 0
    for slug, info in VERIFIED_ARTISTS.items():
        vocal_type, bio, songs = info
        html_path = os.path.join(ARTISTAS_DIR, slug, "index.html")
        if os.path.exists(html_path):
            img_url = get_artist_image_final(slug, slug.replace("-", " ").title())
            if upgrade_html_v4(html_path, slug, vocal_type, bio, songs, img_url):
                print(f"✅ {slug} actualizado a Pro V4")
                count += 1
    print(f"\n✨ ¡Hecho! {count} páginas actualizadas con éxito.")
