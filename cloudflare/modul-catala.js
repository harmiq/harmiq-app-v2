/**
 * modul-catala.js — Mòdul Català de Harmiq
 * Funcionalitats: top cançons, artistes, emergents,
 * recomandador per gènere, cerca, likes, plays, modal fitxa artista
 *
 * Integrat amb Harmiq (app.js no es modifica)
 * Dades: /catala_data.json (local) o backend HF si disponible
 */

"use strict";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const MC_DATA_URL    = "/catala_data.json";
const MC_BACKEND_URL = ""; 
const MC_STORAGE_KEY = "harmiq_cat";

// ─── ESTAT ───────────────────────────────────────────────────────────────────
let mcData      = null;   // { artistes, cancons, meta }
let mcLikes     = {};     // { cancion_id: true/false }
let mcPlays     = {};     // { cancion_id: number }
let mcActiveTab = "top";
let mcGenreFilter = "tots";

// ─── COLORS PER AVATAR ───────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "linear-gradient(135deg,#CF142B,#FF4FA3)",
  "linear-gradient(135deg,#7C4DFF,#FF4FA3)",
  "linear-gradient(135deg,#FCDD09,#FF9F1C)",
  "linear-gradient(135deg,#06D6A0,#118AB2)",
  "linear-gradient(135deg,#CF142B,#7C4DFF)",
  "linear-gradient(135deg,#FF9F1C,#FF4FA3)",
];

function avatarColor(nom) {
  return AVATAR_COLORS[nom.charCodeAt(0) % AVATAR_COLORS.length];
}

function avatarInitials(nom) {
  const parts = nom.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return nom.substring(0,2).toUpperCase();
}

function getYoutubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:v\/|u\/\w\/|embed\/|watch\?v=))([^#\&\?]*)/);
  return (match && match[1].length === 11) ? match[1] : null;
}

// ─── PERSISTÈNCIA (localStorage) ─────────────────────────────────────────────
function loadStorage() {
  try {
    const raw = localStorage.getItem(MC_STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      mcLikes = d.likes || {};
      mcPlays = d.plays || {};
    }
  } catch(_) {}
}

function saveStorage() {
  try {
    localStorage.setItem(MC_STORAGE_KEY, JSON.stringify({
      likes: mcLikes,
      plays: mcPlays,
    }));
  } catch(_) {}
}

// ─── FETCH DADES ─────────────────────────────────────────────────────────────
async function fetchMcData() {
  try {
    const r = await fetch(MC_DATA_URL);
    if (!r.ok) throw new Error("no data");
    mcData = await r.json();
  } catch(e) {
    console.warn("Mòdul Català: no s'han pogut carregar les dades", e);
    mcData = { artistes: [], cancons: [], meta: {} };
  }
}

// ─── ESTADÍSTIQUES ────────────────────────────────────────────────────────────
function updateStats() {
  if (!mcData) return;
  const totalArtistes = mcData.artistes.length;
  const totalCancons = mcData.cancons.length;
  const emergents = mcData.artistes.filter(a => a.emergent).length;
  const totalLikes = Object.keys(mcLikes).filter(k=>mcLikes[k]).length;

  const sArt = document.getElementById("stat-artistes");
  const sCan = document.getElementById("stat-cancons");
  const sEme = document.getElementById("stat-emergents");
  const sLik = document.getElementById("stat-likes");

  if (sArt) sArt.textContent = totalArtistes;
  if (sCan) sCan.textContent = totalCancons;
  if (sEme) sEme.textContent = emergents;
  if (sLik) sLik.textContent = totalLikes;
}

// ─── TOP CANÇONS ─────────────────────────────────────────────────────────────
function renderTop() {
  const container = document.getElementById("top-list-container");
  if (!container || !mcData) return;

  const sorted = [...mcData.cancons]
    .map(c => ({ ...c, score: c.popularitat + (mcLikes[c.id] ? 3 : 0) + (mcPlays[c.id] || 0) * 0.5 }))
    .sort((a,b) => b.score - a.score);

  const rankClass = (i) => i===0?"gold" : i===1?"silver" : i===2?"bronze" : "normal";
  const rankLabel = (i) => i===0?"🥇" : i===1?"🥈" : i===2?"🥉" : `${i+1}`;

  container.innerHTML = sorted.map((c, i) => {
    const yid = getYoutubeId(c.karaoke_url);
    const likeLabel = mcLikes[c.id] ? "Treure m'agrada" : "M'agrada";
    return `
    <article class="top-item" onclick="incrementPlay('${c.id}')">
      <div class="top-rank ${rankClass(i)}">${rankLabel(i)}</div>
      <div class="top-info">
        <div class="top-titol">${c.titol}</div>
        <div class="top-artista">${c.artista} · ${c.genere} · ${c.any}</div>
        ${yid ? `
          <div style="margin-top:.6rem; border-radius:10px; overflow:hidden; background:#000; aspect-ratio:16/9; max-width:240px; cursor:pointer; position:relative"
            onclick="event.stopPropagation(); this.innerHTML='<iframe width=100% height=100% src=https://www.youtube.com/embed/${yid}?autoplay=1 frameborder=0 allow=autoplay allowfullscreen></iframe>'">
            <img src="https://img.youtube.com/vi/${yid}/mqdefault.jpg" style="width:100%;height:100%;object-fit:cover;opacity:.8">
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
              <div style="width:32px;height:32px;background:rgba(255,0,0,.9);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff">▶</div>
            </div>
          </div>
        ` : ''}
        <div class="plays-count" id="plays-${c.id}" style="margin-top:.4rem">▶ ${mcPlays[c.id]||0} reproduccions</div>
      </div>
      <div class="top-actions">
        <button class="btn-like ${mcLikes[c.id]?'liked':''}"
          onclick="event.stopPropagation();toggleLike('${c.id}')"
          id="like-btn-${c.id}"
          aria-label="${likeLabel}">
          ${mcLikes[c.id]?'💛':'🤍'} M'agrada
        </button>
        <a class="btn-karaoke" href="${c.karaoke_url||'#'}" target="_blank" rel="noopener"
          onclick="event.stopPropagation()">🎤 Karaoke</a>
      </div>
    </article>`;
  }).join("");
}

// ─── TOGGLE LIKE ─────────────────────────────────────────────────────────────
function toggleLike(id) {
  mcLikes[id] = !mcLikes[id];
  saveStorage();
  updateStats();
  const btn = document.getElementById(`like-btn-${id}`);
  if (btn) {
    btn.classList.toggle("liked", mcLikes[id]);
    btn.innerHTML = `${mcLikes[id]?'💛':'🤍'} M'agrada`;
  }
}

// ─── INCREMENT PLAYS ──────────────────────────────────────────────────────────
function incrementPlay(id) {
  mcPlays[id] = (mcPlays[id] || 0) + 1;
  saveStorage();
  const el = document.getElementById(`plays-${id}`);
  if (el) el.textContent = `▶ ${mcPlays[id]} reproduccions`;
}

// ─── ARTISTES GRID ────────────────────────────────────────────────────────────
function renderArtistes(contenidor, emergentsOnly=false) {
  const container = document.getElementById(contenidor);
  if (!container || !mcData) return;

  let artistes = mcData.artistes;
  if (emergentsOnly) artistes = artistes.filter(a => a.emergent);

  if (artistes.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--m)">Cap artista trobat</div>`;
    return;
  }

  container.innerHTML = artistes.map(a => `
    <article class="artista-card ${a.emergent?'emergent':''}" onclick="openArtista('${a.id}')">
      <div class="artista-header">
        <div class="artista-avatar" style="background:${avatarColor(a.nom)}">${avatarInitials(a.nom)}</div>
        <div>
          <div class="artista-nom">${a.nom}</div>
          <div class="artista-meta"><span>📍 ${a.origen}</span></div>
        </div>
      </div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.6rem">
        <span class="artista-genere">${a.genere}</span>
        ${a.emergent ? '<span class="emergent-badge">⭐ Emergent</span>' : ''}
      </div>
      <p class="artista-bio">${a.bio}</p>
      <div class="artista-cancons">
        ${(a.cancons||[]).slice(0,3).map(c=>`<span class="cancon-chip">🎵 ${c}</span>`).join("")}
      </div>
    </article>`).join("");
}

// ─── MODAL FITXA ARTISTA ──────────────────────────────────────────────────────
function openArtista(id) {
  const artista = mcData.artistes.find(a => a.id === id);
  if (!artista) return;
  const cançons = mcData.cancons.filter(c => c.artista_id === id);

  document.getElementById("mc-modal-body").innerHTML = `
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.2rem">
      <div class="artista-avatar" style="background:${avatarColor(artista.nom)};width:72px;height:72px;font-size:1.8rem">${avatarInitials(artista.nom)}</div>
      <div>
        <div style="font-family:'Baloo 2',cursive;font-size:1.5rem;font-weight:900">${artista.nom}</div>
        <div style="font-size:.82rem;color:var(--m)">📍 ${artista.origen} · ${artista.genere}</div>
        ${artista.emergent ? '<span class="emergent-badge" style="margin-top:.3rem;display:inline-block">⭐ Artista Emergent</span>' : ''}
      </div>
    </div>
    <p style="font-size:.88rem;color:var(--m);margin-bottom:1.2rem;line-height:1.6">${artista.bio}</p>
    <div style="font-family:'Baloo 2',cursive;font-size:1rem;font-weight:800;margin-bottom:.7rem">🎵 Cançons de l'artista</div>
    <div style="display:flex;flex-direction:column;gap:.5rem">
      ${cançons.length > 0 ? cançons.map(c => {
        const yid = getYoutubeId(c.karaoke_url);
        return `
        <div style="display:flex;flex-direction:column;background:rgba(255,255,255,.04);border-radius:10px;padding:.8rem;gap:.6rem">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-size:.88rem;font-weight:700">${c.titol}</div>
              <div style="font-size:.72rem;color:var(--m)">${c.any} · ${c.durada}</div>
            </div>
            <a href="${c.karaoke_url||'#'}" target="_blank" rel="noopener" class="btn-karaoke">🎤 Karaoke</a>
          </div>
          ${yid ? `<div style="border-radius:8px; overflow:hidden; background:#000; aspect-ratio:16/9; cursor:pointer; position:relative"
            onclick="event.stopPropagation(); this.innerHTML='<iframe width=100% height=100% src=https://www.youtube.com/embed/${yid}?autoplay=1 frameborder=0 allow=autoplay allowfullscreen></iframe>'">
            <img src="https://img.youtube.com/vi/${yid}/mqdefault.jpg" style="width:100%;height:100%;object-fit:cover;opacity:.6"><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff">▶</div>
          </div>` : ''}
        </div>`;
      }).join("") : `<div style="color:var(--m);font-size:.85rem">Cap cançó registrada</div>`}
    </div>`;

  document.getElementById("mc-modal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = document.getElementById("mc-modal");
  if (modal) modal.classList.remove("open");
  document.body.style.overflow = "";
}

// ─── RECOMANDADOR ─────────────────────────────────────────────────────────────
function buildGenreFilters() {
  const container = document.getElementById("rec-genre-filters");
  if (!container || !mcData) return;
  const generes = [...new Set(mcData.artistes.map(a=>a.genere))].sort();
  container.innerHTML = `<button class="rec-filter-btn active" onclick="filterGenre('tots',this)">🎵 Tots</button>` + 
    generes.map(g => `<button class="rec-filter-btn" onclick="filterGenre('${g}',this)">${g}</button>`).join("");
}

function filterGenre(genere, btn) {
  mcGenreFilter = genere;
  document.querySelectorAll("#rec-genre-filters .rec-filter-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderRecomandador();
}

function renderRecomandador() {
  const container = document.getElementById("rec-results");
  if (!container || !mcData) return;
  let cancons = mcData.cancons;
  if (mcGenreFilter !== "tots") {
    const artistesGenere = mcData.artistes.filter(a => a.genere === mcGenreFilter).map(a => a.id);
    cancons = cancons.filter(c => artistesGenere.includes(c.artista_id));
  }
  cancons = [...cancons].sort((a,b) => b.popularitat - a.popularitat).slice(0,10);
  if (cancons.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:1.5rem;color:var(--m)">Cap cançó d'aquest gènere</div>`;
    return;
  }
  container.innerHTML = cancons.map(c => {
    const yid = getYoutubeId(c.karaoke_url);
    return `
    <div class="cancon-item" style="flex-direction:column; gap:.8rem; align-items:stretch">
      <div style="display:flex; align-items:center; gap:.8rem; justify-content:space-between">
        <div style="display:flex; align-items:center; gap:.8rem">
          <div style="font-size:1.3rem">🎵</div>
          <div><div class="cancon-titol">${c.titol}</div><div class="cancon-artista-txt">${c.artista}</div></div>
        </div>
        <a class="btn-karaoke" href="${c.karaoke_url||'#'}" target="_blank" rel="noopener">🎤</a>
      </div>
      ${yid ? `<div style="border-radius:8px; overflow:hidden; background:#000; aspect-ratio:16/9; cursor:pointer; position:relative"
        onclick="this.innerHTML='<iframe width=100% height=100% src=https://www.youtube.com/embed/${yid}?autoplay=1 frameborder=0 allow=autoplay allowfullscreen></iframe>'">
        <img src="https://img.youtube.com/vi/${yid}/mqdefault.jpg" style="width:100%;height:100%;object-fit:cover;opacity:.6"><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff">▶</div>
      </div>` : ''}
    </div>`;
  }).join("");
}

// ─── CERCA ────────────────────────────────────────────────────────────────────
function cercaCatalà(query) {
  const q = (query || "").toLowerCase().trim();
  const container = document.getElementById("cerca-results-container");
  if (!container || !mcData) return;
  if (mcActiveTab !== "cerca") {
    const tabEl = document.querySelector('.mc-tab[onclick*="cerca"]');
    if (tabEl) showTab("cerca", tabEl);
  }
  if (!q || q.length < 2) {
    container.innerHTML = `<div class="cerca-empty">Escriu al menys 2 caràcters per cercar 🏴</div>`;
    return;
  }
  const cançons = mcData.cancons.filter(c => c.titol.toLowerCase().includes(q) || c.artista.toLowerCase().includes(q));
  const artistes = mcData.artistes.filter(a => a.nom.toLowerCase().includes(q) || a.genere.toLowerCase().includes(q));
  if (cançons.length === 0 && artistes.length === 0) {
    container.innerHTML = `<div class="cerca-empty">Cap resultat per "<strong>${escapeHtml(query)}</strong>" 🔍</div>`;
    return;
  }
  let html = "";
  if (artistes.length > 0) {
    html += `<div style="font-family:'Baloo 2',cursive;font-size:1rem;font-weight:800;margin-bottom:.8rem;color:#ff8a94">🎤 Artistes (${artistes.length})</div>`;
    html += `<div class="artistes-grid" style="margin-bottom:1.5rem">${artistes.map(a => `
      <article class="artista-card" onclick="openArtista('${a.id}')">
        <div class="artista-header">
          <div class="artista-avatar" style="background:${avatarColor(a.nom)};width:44px;height:44px;font-size:1rem">${avatarInitials(a.nom)}</div>
          <div><div class="artista-nom" style="font-size:.95rem">${highlightMatch(a.nom, q)}</div><div style="font-size:.75rem;color:var(--m)">${a.origen}</div></div>
        </div>
      </article>`).join("")}</div>`;
  }
  if (cançons.length > 0) {
    html += `<div style="font-family:'Baloo 2',cursive;font-size:1rem;font-weight:800;margin-bottom:.8rem;color:#ff8a94">🎵 Cançons (${cançons.length})</div>`;
    html += `<div class="cancon-list">${cançons.map(c => {
      const yid = getYoutubeId(c.karaoke_url);
      return `
      <div class="cancon-item" style="flex-direction:column; align-items:stretch; gap:.8rem">
        <div style="display:flex; justify-content:space-between; align-items:center">
          <div style="display:flex; gap:.8rem; align-items:center">
            <div style="font-size:1.2rem">🎵</div>
            <div><div class="cancon-titol">${highlightMatch(c.titol, q)}</div><div class="cancon-artista-txt">${highlightMatch(c.artista, q)}</div></div>
          </div>
          <a class="btn-karaoke" href="${c.karaoke_url||'#'}" target="_blank" rel="noopener">🎤</a>
        </div>
        ${yid ? `<div style="border-radius:8px; overflow:hidden; background:#000; aspect-ratio:16/9; cursor:pointer; position:relative"
          onclick="this.innerHTML='<iframe width=100% height=100% src=https://www.youtube.com/embed/${yid}?autoplay=1 frameborder=0 allow=autoplay allowfullscreen></iframe>'">
          <img src="https://img.youtube.com/vi/${yid}/mqdefault.jpg" style="width:100%;height:100%;object-fit:cover;opacity:.6"><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff">▶</div>
        </div>` : ''}
      </div>`;
    }).join("")}</div>`;
  }
  container.innerHTML = html;
}

function highlightMatch(text, query) {
  if (!query) return escapeHtml(text);
  const re = new RegExp(`(${escapeRegex(query)})`, "gi");
  return escapeHtml(text).replace(re, '<mark style="background:rgba(252,221,9,.25);color:#fff;border-radius:3px;padding:0 2px">$1</mark>');
}

function escapeHtml(str) {
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
function showTab(id, el) {
  mcActiveTab = id;
  document.querySelectorAll(".mc-section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".mc-tab").forEach(t => t.classList.remove("active"));
  document.getElementById(`tab-${id}`)?.classList.add("active");
  if (el) el.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (id === "top")          renderTop();
  if (id === "artistes")     renderArtistes("artistes-container", false);
  if (id === "emergents")    renderArtistes("emergents-container", true);
  if (id === "recomandador") renderRecomandador();
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
async function initModulCatala() {
  loadStorage();
  await fetchMcData();
  updateStats();
  buildGenreFilters();
  renderTop();
  // Listener per tancar modal amb Escape
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initModulCatala);
} else {
  initModulCatala();
}
