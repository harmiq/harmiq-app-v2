import os, re

ARTISTAS_DIR = r"E:\Harmiq_viaje\cloudflare\artistas"

for slug in sorted(os.listdir(ARTISTAS_DIR)):
    html_path = os.path.join(ARTISTAS_DIR, slug, "index.html")
    if not os.path.exists(html_path):
        continue
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()
    m_vt = re.search(r'class="badge">([\w\s\u00c0-\u024F]+?) \u2022', content)
    m_name = re.search(r'<h1>(.*?)</h1>', content)
    if m_vt and m_name:
        print(f'{slug}|{m_name.group(1).strip()}|{m_vt.group(1).strip()}')
