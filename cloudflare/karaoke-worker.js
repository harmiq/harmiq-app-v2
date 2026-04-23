// Harmiq Karaoke Backend — Cloudflare Worker
// Rutas:
//   POST /api/karaoke/process   — procesa URL de YT/Vevo o upload
//   POST /api/karaoke/separate  — separa vocal/instrumental con Demucs
//   POST /api/karaoke/transcribe — transcribe con Whisper + timestamps
//   POST /api/karaoke/analyze   — detecta coros, voces, géneros

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === '/api/karaoke/process' && request.method === 'POST') {
        return await handleProcess(request, env);
      }
      if (url.pathname === '/api/karaoke/separate' && request.method === 'POST') {
        return await handleSeparate(request, env);
      }
      if (url.pathname === '/api/karaoke/transcribe' && request.method === 'POST') {
        return await handleTranscribe(request, env);
      }
      if (url.pathname === '/api/karaoke/analyze' && request.method === 'POST') {
        return await handleAnalyze(request, env);
      }
      if (url.pathname === '/api/karaoke/lyrics' && request.method === 'POST') {
        return await handleLyrics(request, env);
      }
      return json({ error: 'Not found' }, 404);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }
};

// ── 1. PROCESS: extrae info del video / acepta upload ──────────────────────
async function handleProcess(request, env) {
  const body = await request.json();
  const { videoUrl, uploadedAudioBase64, title } = body;

  if (videoUrl) {
    // Extraer info básica del video
    const info = await extractVideoInfo(videoUrl, env);
    return json({ ok: true, ...info });
  }

  if (uploadedAudioBase64) {
    // Audio subido directamente
    return json({ ok: true, title: title || 'Audio subido', duration: null, thumbnail: null, source: 'upload', audioBase64: uploadedAudioBase64 });
  }

  return json({ error: 'Debes pasar videoUrl o uploadedAudioBase64' }, 400);
}

async function extractVideoInfo(videoUrl, env) {
  // Detectar plataforma
  const ytMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  const vevoMatch = videoUrl.match(/vevo\.com/);

  if (ytMatch) {
    const videoId = ytMatch[1];
    // Usar yt-dlp via Cloudflare Worker (llamada a servicio proxy)
    // Para la versión gratuita usamos oEmbed de YouTube para metadatos
    const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (!oembedRes.ok) throw new Error('No se pudo obtener info del video');
    const oembedData = await oembedRes.json();

    return {
      videoId,
      title: oembedData.title,
      author: oembedData.author_name,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      platform: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      audioExtractUrl: `https://harmiq-karaoke-audio.harmiq.workers.dev/yt/${videoId}`,
    };
  }

  if (vevoMatch) {
    return { title: 'Video de Vevo', platform: 'vevo', thumbnail: null, audioExtractUrl: videoUrl };
  }

  // URL genérica de audio/video
  return { title: 'Audio personalizado', platform: 'direct', audioExtractUrl: videoUrl };
}

// ── 2. SEPARATE: separa vocal e instrumental con Demucs en HF ──────────────
async function handleSeparate(request, env) {
  const body = await request.json();
  const { audioBase64, audioUrl, mode } = body;
  // mode: 'remove_all' | 'remove_male' | 'remove_female' | 'keep_instrumental' | 'keep_vocals'

  if (!env.HF_TOKEN) return json({ error: 'HF_TOKEN no configurado' }, 500);

  // Llamar a Demucs en Hugging Face Inference API
  // Modelo: facebook/demucs — separa en drums, bass, other, vocals
  let audioData;
  if (audioBase64) {
    audioData = base64ToBuffer(audioBase64);
  } else if (audioUrl) {
    const res = await fetch(audioUrl);
    audioData = await res.arrayBuffer();
  } else {
    return json({ error: 'Se necesita audioBase64 o audioUrl' }, 400);
  }

  // HF Inference API — audio-source-separation
  const hfRes = await fetch(
    'https://api-inference.huggingface.co/models/facebook/demucs',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.HF_TOKEN}`,
        'Content-Type': 'audio/wav',
      },
      body: audioData,
    }
  );

  if (!hfRes.ok) {
    const err = await hfRes.text();
    // Si el modelo está cargando devolvemos estado intermedio
    if (hfRes.status === 503) {
      return json({ status: 'loading', message: 'Modelo cargando, reintenta en 20 segundos', retryAfter: 20 });
    }
    return json({ error: `HF API error: ${err}` }, 500);
  }

  // Demucs devuelve un ZIP con stems
  const zipBuffer = await hfRes.arrayBuffer();
  const zipBase64 = bufferToBase64(zipBuffer);

  return json({
    ok: true,
    stems: { zip: zipBase64 },
    mode,
    message: 'Separación completada. Los stems están en el ZIP.'
  });
}

// ── 3. TRANSCRIBE: Whisper con timestamps para karaoke ────────────────────
async function handleTranscribe(request, env) {
  const body = await request.json();
  const { audioBase64, audioUrl, language } = body;

  if (!env.HF_TOKEN) {
    return json({ error: 'HF_TOKEN no configurado' }, 500);
  }

  let base64Audio;

  try {
    if (audioBase64) {
      base64Audio = audioBase64;
    } else if (audioUrl) {
      const res = await fetch(audioUrl);
      if (!res.ok) throw new Error('No se pudo descargar el audio');

      const buffer = await res.arrayBuffer();
      base64Audio = bufferToBase64(buffer);
    } else {
      return json({ error: 'Se necesita audioBase64 o audioUrl' }, 400);
    }
  } catch (err) {
    return json({ error: 'Error preparando audio: ' + err.message }, 500);
  }

  // Llamada correcta a Whisper (JSON + base64)
  const hfRes = await fetch(
    'https://api-inference.huggingface.co/models/openai/whisper-large-v3',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: base64Audio,
        parameters: {
          return_timestamps: 'word',
          language: language || null,
          task: 'transcribe',
        }
      }),
    }
  );

  if (!hfRes.ok) {
    if (hfRes.status === 503) {
      return json({
        status: 'loading',
        message: 'Whisper cargando, reintenta en 30s',
        retryAfter: 30
      });
    }

    const err = await hfRes.text();
    return json({ error: `Whisper error: ${err}` }, 500);
  }

  const result = await hfRes.json();

  const lines = buildKaraokeLines(result.chunks || []);

  return json({
    ok: true,
    fullText: result.text,
    chunks: result.chunks,
    karaokeLines: lines,
    language: result.language,
  });
}}

// ── 4. ANALYZE: detecta coros, voces (hombre/mujer), estructura ───────────
async function handleAnalyze(request, env) {
  const body = await request.json();
  const { karaokeLines, fullText, title, artist } = body;

  if (!env.HF_TOKEN) return json({ error: 'HF_TOKEN no configurado' }, 500);

  // Usamos claude / llm para analizar estructura musical del texto
  // Con Cloudflare AI Workers (gratis en el plan free)
  const analysisPrompt = `Analiza esta letra de canción y devuelve JSON con:
- "structure": array de secciones [{type:"intro|verse|chorus|bridge|outro", startLine, endLine, label}]
- "voices": array de voces detectadas [{id:"v1", gender:"male|female|unknown", lines:[lineNumbers]}]
- "choruses": array de índices de líneas que son coros (repetidas)
- "language": idioma detectado
- "suggestedKaraokeMode": "full|instrumental_only|remove_male|remove_female"

Letra:
${fullText || karaokeLines?.map(l => l.text).join('\n')}

Título: ${title || 'desconocido'}
Artista: ${artist || 'desconocido'}

Responde SOLO con el JSON, sin texto adicional.`;

  // Cloudflare Workers AI — llama3 (gratis)
  const aiRes = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
    messages: [{ role: 'user', content: analysisPrompt }],
    max_tokens: 1000,
  });

  let analysis;
  try {
    const rawText = aiRes.response || aiRes.result?.response || '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch {
    analysis = { structure: [], voices: [], choruses: [], language: 'unknown' };
  }

  return json({ ok: true, analysis });
}

// ── 5. LYRICS: busca letra online como fallback ────────────────────────────
async function handleLyrics(request, env) {
  const body = await request.json();
  const { title, artist } = body;

  if (!title) return json({ error: 'title requerido' }, 400);

  // Genius API (gratuita con token)
  if (env.GENIUS_TOKEN) {
    const searchRes = await fetch(
      `https://api.genius.com/search?q=${encodeURIComponent(`${artist || ''} ${title}`)}`,
      { headers: { Authorization: `Bearer ${env.GENIUS_TOKEN}` } }
    );
    const searchData = await searchRes.json();
    const hit = searchData.response?.hits?.[0]?.result;
    if (hit) {
      return json({ ok: true, source: 'genius', title: hit.full_title, url: hit.url, thumbnailUrl: hit.song_art_image_thumbnail_url });
    }
  }

  return json({ ok: false, message: 'No se encontraron letras' });
}

// ── HELPERS ────────────────────────────────────────────────────────────────

function buildKaraokeLines(chunks) {
  // Agrupa palabras en líneas de ~8 palabras o por pausas largas
  const lines = [];
  let currentLine = { words: [], startTime: null, endTime: null };

  for (const chunk of chunks) {
    const [start, end] = chunk.timestamp || [0, 0];
    if (currentLine.startTime === null) currentLine.startTime = start;

    currentLine.words.push({ text: chunk.text, start, end });
    currentLine.endTime = end;

    const gapToNext = chunks[chunks.indexOf(chunk) + 1]?.timestamp?.[0];
    const longPause = gapToNext && (gapToNext - end) > 1.5;
    const lineLength = currentLine.words.length >= 8;

    if (longPause || lineLength) {
      lines.push({
        text: currentLine.words.map(w => w.text).join(''),
        words: currentLine.words,
        startTime: currentLine.startTime,
        endTime: currentLine.endTime,
        id: lines.length,
      });
      currentLine = { words: [], startTime: null, endTime: null };
    }
  }

  if (currentLine.words.length > 0) {
    lines.push({
      text: currentLine.words.map(w => w.text).join(''),
      words: currentLine.words,
      startTime: currentLine.startTime,
      endTime: currentLine.endTime,
      id: lines.length,
    });
  }

  return lines;
}

function base64ToBuffer(base64) {
  const binary = atob(base64.replace(/^data:[^;]+;base64,/, ''));
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
  return buffer.buffer;
}

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
