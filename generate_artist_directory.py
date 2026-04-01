import os, json, re, urllib.parse

from upgrade_artist_pages_v3 import VERIFIED_ARTISTS # Reutilizar la base de datos

ARTISTAS_INDEX = r"E:\Harmiq_viaje\cloudflare\artistas\index.html"
CACHE_PATH = r"E:\Harmiq_viaje\itunes_img_cache.json"

def load_cache():
    if os.path.exists(CACHE_PATH):
        try:
            with open(CACHE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return {}
    return {}

IMG_CACHE = load_cache()

def get_img(artist_name):
    # Intentar sacar del caché de itunes que ya poblamos anteriormente
    return IMG_CACHE.get(artist_name, "")

def generate_directory():
    artists_html = ""
    # Ordenar alfabéticamente por nombre (no por slug)
    sorted_artists = sorted(VERIFIED_ARTISTS.items(), key=lambda x: x[0].replace("-", " "))
    
    for slug, info in sorted_artists:
        vocal_type = info[0]
        # El nombre real puede estar capitalizado en cache o derivado del slug
        display_name = slug.replace("-", " ").title()
        img_url = get_img(display_name)
        if not img_url:
            # Reintentar con nombre exacto del dict si falla
            img_url = get_img(slug.replace("-", " ").title())
            
        # Placeholder si no hay imagen (no debería pasar si el cache está bien)
        if not img_url:
            img_url = f"https://api.dicebear.com/7.x/initials/svg?seed={slug}"

        artists_html += f'''
        <a href="/artistas/{slug}/" class="artist-card" data-name="{display_name.lower()}" data-type="{vocal_type.lower()}">
            <img src="{img_url}" alt="{display_name}" loading="lazy">
            <div class="artist-info">
                <h3>{display_name}</h3>
                <span class="vocal-tag">{vocal_type}</span>
            </div>
        </a>'''

    html_template = f'''<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>Directorio de Voces y Cantantes | Harmiq IA</title>
    <meta name="description" content="Explora el directorio completo de perfiles vocales de Harmiq. Descubre el tipo de voz de tus artistas favoritos: Sopranos, Tenores, Barítonos y más.">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root{{--p:#7C4DFF;--a:#FF4FA3;--dark:#0A0818;--card:#130F2A;--t:#E5E7EB;--m:#6B7280;}}
        *{{margin:0;padding:0;box-sizing:border-box;}}
        body{{background:var(--dark);color:var(--t);font-family:'Outfit',sans-serif;line-height:1.6;}}
        nav{{display:flex;justify-content:space-between;align-items:center;padding:1rem 4%;background:rgba(10,8,24,.95);border-bottom:1px solid rgba(255,255,255,.07);position:sticky;top:0;z-index:100;}}
        .logo{{font-size:1.7rem;font-weight:900;background:linear-gradient(135deg,#7C4DFF,#FF4FA3);-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-decoration:none;}}
        .container{{max-width:1200px;margin:0 auto;padding:3rem 5%;}}
        
        .header-section {{text-align:center; margin-bottom:3rem;}}
        h1 {{font-size:3rem; font-weight:900; margin-bottom:1rem;}}
        .search-container {{max-width:600px; margin:0 auto 2rem; position:relative;}}
        #artistSearch {{
            width:100%; padding:1.2rem 1.5rem; border-radius:50px; 
            background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
            color:white; font-family:'Outfit'; font-size:1.1rem; outline:none;
            transition: all 0.3s;
        }}
        #artistSearch:focus {{border-color:var(--p); box-shadow:0 0 20px rgba(124,77,255,0.2);}}

        .artist-grid {{
            display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap:1.5rem;
        }}
        .artist-card {{
            background:var(--card); border-radius:1.5rem; overflow:hidden;
            border:1px solid rgba(255,255,255,0.05); transition:all 0.3s;
            text-decoration:none; color:white; display:block;
        }}
        .artist-card:hover {{
            transform:translateY(-10px); border-color:var(--p);
            box-shadow:0 15px 30px rgba(0,0,0,0.4);
        }}
        .artist-card img {{
            width:100%; height:200px; object-fit:cover;
            border-bottom:1px solid rgba(255,255,255,0.05);
        }}
        .artist-info {{padding:1.2rem; text-align:center;}}
        .artist-info h3 {{font-size:1.1rem; margin-bottom:0.5rem; font-weight:700;}}
        .vocal-tag {{
            font-size:0.75rem; font-weight:800; text-transform:uppercase;
            color:var(--a); background:rgba(255,79,163,0.1);
            padding:4px 10px; border-radius:20px;
        }}

        footer {{padding:3rem; text-align:center; color:var(--m); font-size:0.9rem; border-top:1px solid rgba(255,255,255,0.05); margin-top:4rem;}}
    </style>
</head>
<body>
    <nav>
        <a href="/" class="logo">Harmiq</a>
        <a href="/" style="color:#fff;text-decoration:none;font-weight:800;background:linear-gradient(90deg,#7C4DFF,#FF4FA3);padding:0.5rem 1rem;border-radius:30px;font-size:0.85rem;">IA Gratis</a>
    </nav>
    
    <div class="container">
        <div class="header-section">
            <h1>Directorio de Voces</h1>
            <p style="color:var(--m); margin-bottom:2rem;">Explora nuestra base de datos de artistas verificados por nuestra IA.</p>
            <div class="search-container">
                <input type="text" id="artistSearch" placeholder="Busca tu cantante favorito (ej: Bad Bunny, Adele...)" onkeyup="filterArtists()">
            </div>
        </div>

        <div class="artist-grid" id="artistGrid">
            {artists_html}
        </div>
    </div>

    <footer>
        © 2026 Harmiq — Análisis Vocal con Inteligencia Artificial
    </footer>

    <script>
        function filterArtists() {{
            let input = document.getElementById('artistSearch').value.toLowerCase();
            let cards = document.getElementsByClassName('artist-card');
            
            for (let card of cards) {{
                let name = card.getAttribute('data-name');
                let type = card.getAttribute('data-type');
                if (name.includes(input) || type.includes(input)) {{
                    card.style.display = "block";
                }} else {{
                    card.style.display = "none";
                }}
            }}
        }}
    </script>
</body>
</html>'''

    with open(ARTISTAS_INDEX, "w", encoding="utf-8") as f:
        f.write(html_template)
    print(f"Directorio generado con éxito en {{ARTISTAS_INDEX}}")

if __name__ == "__main__":
    generate_directory()
