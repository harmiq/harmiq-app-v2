/**
 * app.js — Harmiq PRODUCCIÓN v7
 * FIX: botones género visual, auto-selección, HF_API_URL, GDPR
 * Un solo archivo. No requiere analyzer.js.
 *
 * FIXES v5:
 * 1. Emoji duplicado en botón grabar — CORREGIDO
 * 2. Barítono clasificado como tenor — CORREGIDO (umbral 215Hz + pitch_range)
 * 3. Fotos de artistas — Wikipedia cache + avatar iniciales (sin CORS)
 * 4. YouTube embeds — IDs fijos por tipo de voz (listType=search bloqueado)
 * 5. Páginas SEO /voz/* — contenido extenso, home studio 4 packs, karaoke/eventos
 * 6. Tarjeta viral vertical — formato Stories RRSS con foto artista
 * 7. Canciones recomendadas de Spotify en resultado
 * 8. Filtros: época + género musical + idioma/país
 * 9. Sección karaoke/eventos en resultado principal
 * 10. Fotos en todas las cards de artistas con fallback de iniciales
 * 11. Router robusto — /voz/* funcional, no recarga la página
 * 12. Matching con boost de popularidad local por país del usuario
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════════
const AMAZON_DOMAINS = { ES:"es",US:"com",MX:"com.mx",UK:"co.uk",DE:"de",FR:"fr",IT:"it",CA:"ca",BR:"com.br",JP:"co.jp" };
const AFFILIATE_ID   = "harmiqapp-20";
const DB_PATH        = "/harmiq_db_vectores.json";
const HF_API_URL     = "https://hamiq-harmiq-backend1.hf.space/analyze";

// Plataformas musicales por país (geolocalización)
const MUSIC_PLATFORM = {
  ES:"spotify", MX:"spotify", AR:"spotify", CO:"spotify", CL:"spotify",
  US:"apple",   CA:"apple",
  UK:"spotify", DE:"spotify", FR:"spotify", IT:"spotify",
  JP:"line",    KR:"melon",
  DEFAULT:"spotify"
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRADUCCIONES — 11 idiomas
// ═══════════════════════════════════════════════════════════════════════════════
const T = {
  es:{
    "nav-cta":"Analizar mi voz","hero-badge":"Análisis vocal con IA · 12.000 artistas · 100% Gratis",
    "hero-grad":"cantante famoso","hero-title-rest":"vive en tu voz",
    "hero-desc":"Canta 10 segundos. La IA analiza tu tono, timbre y rango vocal y te dice con qué artista famoso coincides.",
    "btn-main":"🎤 Analizar mi voz — gratis","btn-how":"Ver cómo funciona",
    "hero-sub":"Sin registro · Sin instalar nada · Funciona en móvil",
    "stat1":"Artistas de todo el mundo","stat2":"Idiomas","stat3":"Para tu resultado","stat4":"Gratis siempre",
    "app-title":"Analiza tu voz","app-desc":"Selecciona tu voz, sube un audio o graba directamente",
    "opt-default":"Selecciona tu voz","opt-male":"Voz masculina","opt-female":"Voz femenina",
    "btn-record-text":"Grabar y analizar",
    "how-title":"Cómo funciona","how-sub":"Tres pasos. Sin registro. Sin instalar nada.",
    "step1-t":"1. Canta unos segundos","step1-d":"Sube un audio o usa el micrófono. Solo necesitas 5-10 segundos.",
    "step2-t":"2. La IA analiza tu voz","step2-d":"Detectamos tu frecuencia fundamental, timbre y rango vocal.",
    "step3-t":"3. Descubre tu cantante","step3-d":"Te decimos qué artista famoso coincide contigo, con % de similitud.",
    "voices-title":"Descubre tu tipo de voz","voices-sub":"Cada tipo de voz tiene sus canciones y artistas ideales.",
    "feat-title":"Todo lo que incluye Harmiq","feat-sub":"Mucho más que un simple test de voz.",
    "f1-t":"12.000 artistas globales","f1-d":"De US, UK, Japón, Corea, Brasil, España, Italia, Francia y más.",
    "f2-t":"Canciones para tu voz","f2-d":"Canciones adaptadas a tu rango vocal exacto y géneros favoritos.",
    "f3-t":"Artistas por país","f3-d":"Filtra por región y descubre artistas locales que coinciden contigo.",
    "f4-t":"Comparte tu resultado","f4-d":"Comparte en WhatsApp, Twitter, LINE, VK o Weibo.",
    "f5-t":"Busca tu artista favorito","f5-d":"Compara tu voz con cualquier artista de nuestra base de datos.",
    "f6-t":"Privacidad garantizada","f6-d":"Tu audio se analiza y se borra inmediatamente.",
    "cta-title":"Descubre tu tipo de voz ahora","cta-desc":"Análisis gratuito en 10 segundos. 12.000 artistas.",
    "cta-btn":"🎤 Analizar mi voz gratis",
    "_upload_btn":"📁 Subir audio","_upload_hint":"WAV · MP3 · M4A · OGG · FLAC · mín. 5 seg",
    "_or":"— o —","_analyzing":"🔍 Analizando tu voz…","_rec_stop":"⏹ Detener",
    "_result":"Tu resultado","_similarity":"similitud","_vt_label":"Tu tipo de voz","_confidence":"confianza",
    "_share":"📲 Comparte tu resultado","_copy":"📋 Copiar",
    "_share_txt":"🎤 Mi voz se parece a {name} con {pct}% de similitud. ¡Analiza la tuya en harmiq.app!",
    "_err_short":"Audio demasiado corto. Canta al menos 3 segundos.",
    "_err_silent":"Señal muy baja. Acerca el micrófono y canta más fuerte.",
    "_err_mic":"No se pudo acceder al micrófono. Comprueba los permisos.",
    "_err_gender":"Selecciona primero tu tipo de voz (masculina o femenina).",
    "_err_db":"Base de datos no disponible. Recarga la página.",
    "_filter_era":"Época","_all_eras":"Todas las épocas",
    "_eras":{"pre-1960s":"Clásicos pre-60","1960s":"Los 60","1970s-80s":"70s y 80s","1970s":"Los 70","1980s":"Los 80","1990s":"Los 90","2000s+":"Años 2000","2010s+":"Años 2010","2020s":"Años 2020","2026":"Éxitos 2025-26"},
    "_karaoke":"🎤 Karaoke","_platform":"🎵 Escuchar","_rec_tips":"Para mejor resultado: canta sin música · acerca el micro · evita el eco",
    "_vt_names":{"bass":"Bajo","bass-baritone":"Bajo-Barítono","baritone":"Barítono","tenor":"Tenor","countertenor":"Contratenor","contralto":"Contralto","mezzo-soprano":"Mezzosoprano","soprano":"Soprano"},
  },
  en:{
    "nav-cta":"Analyze my voice","hero-badge":"AI Vocal Analysis · 12,000 artists · 100% Free",
    "hero-grad":"famous singer","hero-title-rest":"lives in your voice",
    "hero-desc":"Sing 10 seconds. The AI analyzes your tone, timbre and vocal range and tells you which famous artist you match.",
    "btn-main":"🎤 Analyze my voice — free","btn-how":"See how it works",
    "hero-sub":"No sign-up · No install · Works on mobile",
    "stat1":"Artists worldwide","stat2":"Languages","stat3":"For your result","stat4":"Always free",
    "app-title":"Analyze your voice","app-desc":"Select your voice type, upload audio or record directly",
    "opt-default":"Select your voice","opt-male":"Male voice","opt-female":"Female voice",
    "btn-record-text":"Record & Analyze",
    "how-title":"How it works","how-sub":"Three steps. No sign-up. No install.",
    "step1-t":"1. Sing a few seconds","step1-d":"Upload audio or use your mic. Just 5-10 seconds.",
    "step2-t":"2. AI analyzes your voice","step2-d":"We detect your fundamental frequency, timbre and vocal range.",
    "step3-t":"3. Discover your singer","step3-d":"We tell you which famous artist matches your voice, with % similarity.",
    "voices-title":"Discover your voice type","voices-sub":"Each voice type has its ideal songs and artists.",
    "feat-title":"Everything Harmiq includes","feat-sub":"Much more than a simple voice test.",
    "f1-t":"12,000 global artists","f1-d":"From US, UK, Japan, Korea, Brazil, Spain, Italy and more.",
    "f2-t":"Songs for your voice","f2-d":"Songs adapted to your exact vocal range and favourite genres.",
    "f3-t":"Artists by country","f3-d":"Filter by region and discover local artists that match you.",
    "f4-t":"Share your result","f4-d":"Share on WhatsApp, Twitter, LINE, VK or Weibo.",
    "f5-t":"Search your favourite artist","f5-d":"Compare your voice with any artist in our database.",
    "f6-t":"Privacy guaranteed","f6-d":"Your audio is analyzed and deleted immediately.",
    "cta-title":"Discover your voice type now","cta-desc":"Free analysis in 10 seconds. 12,000 artists.",
    "cta-btn":"🎤 Analyze my voice free",
    "_upload_btn":"📁 Upload audio","_upload_hint":"WAV · MP3 · M4A · OGG · FLAC · min. 5 sec",
    "_or":"— or —","_analyzing":"🔍 Analyzing your voice…","_rec_stop":"⏹ Stop",
    "_result":"Your result","_similarity":"similarity","_vt_label":"Your voice type","_confidence":"confidence",
    "_share":"📲 Share your result","_copy":"📋 Copy",
    "_share_txt":"🎤 My voice sounds like {name} with {pct}% similarity. Try yours at harmiq.app!",
    "_err_short":"Audio too short. Sing at least 3 seconds.",
    "_err_silent":"Signal too low. Get closer to the mic and sing louder.",
    "_err_mic":"Could not access microphone. Check permissions.",
    "_err_gender":"Select your voice type first (male or female).",
    "_err_db":"Database not available. Reload the page.",
    "_filter_era":"Era","_all_eras":"All eras",
    "_eras":{"pre-1960s":"Pre-60s classics","1960s":"The 60s","1970s-80s":"70s & 80s","1970s":"The 70s","1980s":"The 80s","1990s":"The 90s","2000s+":"2000s","2010s+":"2010s","2020s":"2020s","2026":"Hits 2025-26"},
    "_karaoke":"🎤 Karaoke","_platform":"🎵 Listen","_rec_tips":"For best results: sing without background music · get close to the mic · avoid echo",
    "_vt_names":{"bass":"Bass","bass-baritone":"Bass-Baritone","baritone":"Baritone","tenor":"Tenor","countertenor":"Countertenor","contralto":"Contralto","mezzo-soprano":"Mezzo-soprano","soprano":"Soprano"},
  },
  ca:{
    "nav-cta":"Analitza la teva veu","hero-badge":"Anàlisi vocal amb IA · 12.000 artistes · 100% Gratis",
    "hero-grad":"cantant famós","hero-title-rest":"viu a la teva veu",
    "hero-desc":"Canta 10 segons. La IA analitza el teu to, timbre i rang vocal i et diu amb quin artista famós coincideixes.",
    "btn-main":"🎤 Analitza la teva veu — gratis","btn-how":"Veure com funciona",
    "hero-sub":"Sense registre · Sense instal·lar res · Funciona al mòbil",
    "stat1":"Artistes de tot el món","stat2":"Idiomes","stat3":"Per al teu resultat","stat4":"Sempre gratis",
    "app-title":"Analitza la teva veu","app-desc":"Selecciona el teu tipus de veu, puja un àudio o grava directament",
    "opt-default":"Selecciona el teu tipus de veu","opt-male":"Veu masculina","opt-female":"Veu femenina",
    "btn-record-text":"Gravar i analitzar",
    "how-title":"Com funciona","how-sub":"Tres passos. Sense registre. Sense instal·lar res.",
    "step1-t":"1. Canta uns segons","step1-d":"Puja un àudio o usa el micròfon. Només necessites 5-10 segons.",
    "step2-t":"2. La IA analitza la teva veu","step2-d":"Detectem la teva freqüència fonamental, timbre i rang vocal.",
    "step3-t":"3. Descobreix el teu cantant","step3-d":"Et diem quin artista famós coincideix amb la teva veu, amb % de similitud.",
    "voices-title":"Descobreix el teu tipus de veu","voices-sub":"Cada tipus de veu té les seves cançons i artistes ideals.",
    "feat-title":"Tot el que inclou Harmiq","feat-sub":"Molt més que un simple test de veu.",
    "f1-t":"12.000 artistes globals","f1-d":"De tot el món: pop, rock, flamenco, jazz, k-pop i molt més.",
    "f2-t":"Cançons per a la teva veu","f2-d":"Cançons adaptades al teu rang vocal exacte i gèneres favorits.",
    "f3-t":"Artistes per país","f3-d":"Filtra per regió i descobreix artistes locals que coincideixen amb tu.",
    "f4-t":"Comparteix el resultat","f4-d":"Comparteix a WhatsApp, Twitter, LINE, VK o Weibo.",
    "f5-t":"Cerca el teu artista favorit","f5-d":"Compara la teva veu amb qualsevol artista de la nostra base de dades.",
    "f6-t":"Privacitat garantida","f6-d":"El teu àudio s'analitza i s'esborra immediatament. No guardem cap gravació.",
    "cta-title":"Descobreix el teu tipus de veu ara","cta-desc":"Anàlisi gratuïta en 10 segons. 12.000 artistes de tot el món.","cta-btn":"🎤 Analitza la teva veu gratis",
    "_upload_btn":"📁 Pujar àudio","_upload_hint":"WAV · MP3 · M4A · OGG · FLAC · mín. 5 seg",
    "_or":"— o —","_analyzing":"🔍 Analitzant…","_rec_stop":"⏹ Aturar",
    "_result":"El teu resultat","_similarity":"similitud","_vt_label":"El teu tipus de veu","_confidence":"confiança",
    "_share":"📲 Comparteix","_copy":"📋 Copiar",
    "_share_txt":"🎤 La meva veu s'assembla a {name} amb {pct}% de similitud. harmiq.app",
    "_err_short":"Àudio massa curt.","_err_silent":"Senyal molt baixa.","_err_mic":"No s'ha pogut accedir al micròfon.",
    "_err_gender":"Selecciona primer el teu tipus de veu.","_err_db":"Base de dades no disponible.",
    "_filter_era":"Època","_all_eras":"Totes les èpoques",
    "_eras":{"pre-1960s":"Abans dels 60","1960s":"Anys 60","1970s-80s":"70s – 80s","1990s":"Anys 90","2000s+":"Anys 2000","2010s+":"Anys 2010+"},
    "_karaoke":"🎤 Karaoke","_platform":"🎵 Escoltar","_rec_tips":"Per millors resultats: canta sense música · apropa't al micro",
    "_vt_names":{"bass":"Baix","bass-baritone":"Baix-Baríton","baritone":"Baríton","tenor":"Tenor","countertenor":"Contratenor","contralto":"Contralt","mezzo-soprano":"Mezzosoprano","soprano":"Soprano"},
  },
  fr:{
    "nav-cta":"Analyser ma voix","hero-badge":"Analyse vocale IA · 12 000 artistes · 100% Gratuit",
    "hero-grad":"chanteur célèbre","hero-title-rest":"vit dans ta voix",
    "hero-desc":"Chante 10 secondes. L'IA analyse ton ton, timbre et tessiture.",
    "btn-main":"🎤 Analyser ma voix — gratuit","btn-how":"Voir comment ça marche","hero-sub":"Sans inscription · Sans installation",
    "stat1":"Artistes du monde","stat2":"Langues","stat3":"Pour ton résultat","stat4":"Toujours gratuit",
    "app-title":"Analyse ta voix","app-desc":"Sélectionne ta voix, télécharge ou enregistre",
    "opt-default":"Sélectionne ta voix","opt-male":"Voix masculine","opt-female":"Voix féminine","btn-record-text":"Enregistrer et analyser",
    "how-title":"Comment ça marche","how-sub":"Trois étapes. Sans inscription.",
    "step1-t":"1. Chante quelques secondes","step1-d":"Télécharge ou utilise le micro. 5-10 secondes suffisent.",
    "step2-t":"2. L'IA analyse ta voix","step2-d":"On détecte ta fréquence, timbre et tessiture.",
    "step3-t":"3. Découvre ton chanteur","step3-d":"On te dit quel artiste célèbre te ressemble.",
    "voices-title":"Découvre ton type de voix","voices-sub":"Chaque voix a ses artistes idéaux.",
    "feat-title":"Tout ce qu'inclut Harmiq","feat-sub":"Bien plus qu'un test vocal.",
    "f1-t":"12 000 artistes","f1-d":"Du monde entier.","f2-t":"Chansons pour ta voix","f2-d":"Adaptées à ta tessiture.",
    "f3-t":"Artistes par pays","f3-d":"Filtre par région.","f4-t":"Partage ton résultat","f4-d":"Sur WhatsApp, Twitter...",
    "f5-t":"Cherche ton artiste","f5-d":"Compare ta voix.","f6-t":"Confidentialité","f6-d":"Audio supprimé immédiatement.",
    "cta-title":"Découvre ton type de voix maintenant","cta-desc":"Analyse gratuite en 10 secondes.","cta-btn":"🎤 Analyser gratuit",
    "_upload_btn":"📁 Télécharger audio","_upload_hint":"WAV · MP3 · M4A · min. 5 sec",
    "_or":"— ou —","_analyzing":"🔍 Analyse…","_rec_stop":"⏹ Arrêter",
    "_result":"Ton résultat","_similarity":"similarité","_vt_label":"Ton type de voix","_confidence":"confiance",
    "_share":"📲 Partager","_copy":"📋 Copier",
    "_share_txt":"🎤 Ma voix ressemble à {name} avec {pct}% de similarité. harmiq.app",
    "_err_short":"Audio trop court.","_err_silent":"Signal trop faible.","_err_mic":"Impossible d'accéder au micro.",
    "_err_gender":"Sélectionne d'abord ton type de voix.","_err_db":"Base de données indisponible.",
    "_filter_era":"Époque","_all_eras":"Toutes les époques",
    "_eras":{"pre-1960s":"Avant les 60s","1960s":"Les 60s","1970s-80s":"70s – 80s","1990s":"Les 90s","2000s+":"Années 2000","2010s+":"Années 2010+"},
    "_karaoke":"🎤 Karaoké","_platform":"🎵 Écouter","_rec_tips":"Pour de meilleurs résultats: sans musique · proche du micro",
    "_vt_names":{"bass":"Basse","bass-baritone":"Basse-Baryton","baritone":"Baryton","tenor":"Ténor","countertenor":"Contre-ténor","contralto":"Contralto","mezzo-soprano":"Mezzo-soprano","soprano":"Soprano"},
  },
  de:{
    "nav-cta":"Stimme analysieren","hero-badge":"KI-Stimmanalyse · 12.000 Künstler · 100% Kostenlos",
    "hero-grad":"berühmter Sänger","hero-title-rest":"lebt in deiner Stimme",
    "hero-desc":"Singe 10 Sekunden. Die KI analysiert Ton, Timbre und Stimmumfang.",
    "btn-main":"🎤 Stimme analysieren — kostenlos","btn-how":"Wie es funktioniert","hero-sub":"Keine Anmeldung · Keine Installation",
    "stat1":"Weltweite Künstler","stat2":"Sprachen","stat3":"Bis zum Ergebnis","stat4":"Immer kostenlos",
    "app-title":"Analysiere deine Stimme","app-desc":"Wähle deinen Stimmtyp, lade hoch oder nimm auf",
    "opt-default":"Wähle deine Stimme","opt-male":"Männerstimme","opt-female":"Frauenstimme","btn-record-text":"Aufnehmen & Analysieren",
    "how-title":"Wie es funktioniert","how-sub":"Drei Schritte. Keine Anmeldung.",
    "step1-t":"1. Singe ein paar Sekunden","step1-d":"Lade hoch oder nutze das Mikrofon.","step2-t":"2. KI analysiert deine Stimme","step2-d":"Wir erkennen Grundfrequenz, Timbre und Stimmumfang.",
    "step3-t":"3. Entdecke deinen Sänger","step3-d":"Wir sagen dir, welcher Künstler deiner Stimme am ähnlichsten ist.",
    "voices-title":"Entdecke deinen Stimmtyp","voices-sub":"Jeder Stimmtyp hat seine idealen Songs.",
    "feat-title":"Alles in Harmiq","feat-sub":"Viel mehr als ein Stimmtest.",
    "f1-t":"12.000 globale Künstler","f1-d":"Aus aller Welt.","f2-t":"Songs für deine Stimme","f2-d":"Angepasst an deinen Stimmumfang.",
    "f3-t":"Künstler nach Land","f3-d":"Filtre nach Region.","f4-t":"Ergebnis teilen","f4-d":"Auf WhatsApp, Twitter...",
    "f5-t":"Lieblungskünstler suchen","f5-d":"Vergleiche deine Stimme.","f6-t":"Datenschutz","f6-d":"Audio sofort gelöscht.",
    "cta-title":"Entdecke jetzt deinen Stimmtyp","cta-desc":"Kostenlose Analyse in 10 Sekunden.","cta-btn":"🎤 Stimme kostenlos analysieren",
    "_upload_btn":"📁 Audio hochladen","_upload_hint":"WAV · MP3 · M4A · min. 5 Sek.",
    "_or":"— oder —","_analyzing":"🔍 Analysiere…","_rec_stop":"⏹ Aufnahme stoppen",
    "_result":"Dein Ergebnis","_similarity":"Ähnlichkeit","_vt_label":"Dein Stimmtyp","_confidence":"Vertrauen",
    "_share":"📲 Teilen","_copy":"📋 Kopieren",
    "_share_txt":"🎤 Meine Stimme klingt wie {name} mit {pct}% Ähnlichkeit. harmiq.app",
    "_err_short":"Audio zu kurz.","_err_silent":"Signal zu schwach.","_err_mic":"Kein Mikrofonzugriff.",
    "_err_gender":"Wähle zuerst deinen Stimmtyp.","_err_db":"Datenbank nicht verfügbar.",
    "_filter_era":"Jahrzehnt","_all_eras":"Alle Jahrzehnte",
    "_eras":{"pre-1960s":"Vor den 60ern","1960s":"Die 60er","1970s-80s":"70er – 80er","1990s":"Die 90er","2000s+":"2000er","2010s+":"2010er+"},
    "_karaoke":"🎤 Karaoke","_platform":"🎵 Anhören","_rec_tips":"Für beste Ergebnisse: ohne Hintergrundmusik · nah am Mikrofon",
    "_vt_names":{"bass":"Bass","bass-baritone":"Bass-Bariton","baritone":"Bariton","tenor":"Tenor","countertenor":"Kontratenor","contralto":"Kontralto","mezzo-soprano":"Mezzosopran","soprano":"Sopran"},
  },
  it:{
    "nav-cta":"Analizza la mia voce","hero-badge":"Analisi vocale IA · 12.000 artisti · 100% Gratis",
    "hero-grad":"cantante famoso","hero-title-rest":"vive nella tua voce",
    "hero-desc":"Canta 10 secondi. L'IA analizza il tuo tono, timbro e estensione vocale.",
    "btn-main":"🎤 Analizza la mia voce — gratis","btn-how":"Vedi come funziona","hero-sub":"Senza registrazione · Senza installare nulla",
    "stat1":"Artisti nel mondo","stat2":"Lingue","stat3":"Per il tuo risultato","stat4":"Sempre gratis",
    "app-title":"Analizza la tua voce","app-desc":"Seleziona la tua voce, carica o registra",
    "opt-default":"Seleziona la tua voce","opt-male":"Voce maschile","opt-female":"Voce femminile","btn-record-text":"Registra e Analizza",
    "how-title":"Come funziona","how-sub":"Tre passi. Senza registrazione.",
    "step1-t":"1. Canta qualche secondo","step1-d":"Carica o usa il microfono.","step2-t":"2. L'IA analizza la voce","step2-d":"Rileviamo frequenza, timbro ed estensione.",
    "step3-t":"3. Scopri il tuo cantante","step3-d":"Ti diciamo quale artista ti assomiglia.",
    "voices-title":"Scopri il tuo tipo di voce","voices-sub":"Ogni voce ha i suoi artisti ideali.",
    "feat-title":"Tutto Harmiq","feat-sub":"Molto più di un test vocale.",
    "f1-t":"12.000 artisti","f1-d":"Da tutto il mondo.","f2-t":"Canzoni per la tua voce","f2-d":"Adattate alla tua estensione.",
    "f3-t":"Artisti per paese","f3-d":"Filtra per regione.","f4-t":"Condividi il risultato","f4-d":"Su WhatsApp, Twitter...",
    "f5-t":"Cerca artista","f5-d":"Confronta la tua voce.","f6-t":"Privacy","f6-d":"Audio eliminato subito.",
    "cta-title":"Scopri il tuo tipo di voce","cta-desc":"Analisi gratuita in 10 secondi.","cta-btn":"🎤 Analizza gratis",
    "_upload_btn":"📁 Carica audio","_upload_hint":"WAV · MP3 · M4A · min. 5 sec",
    "_or":"— oppure —","_analyzing":"🔍 Analisi…","_rec_stop":"⏹ Ferma",
    "_result":"Il tuo risultato","_similarity":"somiglianza","_vt_label":"Il tuo tipo di voce","_confidence":"confidenza",
    "_share":"📲 Condividi","_copy":"📋 Copia",
    "_share_txt":"🎤 La mia voce somiglia a {name} con {pct}% di somiglianza. harmiq.app",
    "_err_short":"Audio troppo corto.","_err_silent":"Segnale troppo debole.","_err_mic":"Impossibile accedere al microfono.",
    "_err_gender":"Seleziona prima il tuo tipo di voce.","_err_db":"Database non disponibile.",
    "_filter_era":"Decennio","_all_eras":"Tutti i decenni",
    "_eras":{"pre-1960s":"Prima degli anni 60","1960s":"Anni 60","1970s-80s":"70s – 80s","1990s":"Anni 90","2000s+":"Anni 2000","2010s+":"Anni 2010+"},
    "_karaoke":"🎤 Karaoke","_platform":"🎵 Ascolta","_rec_tips":"Per risultati migliori: senza musica di fondo · vicino al microfono",
    "_vt_names":{"bass":"Basso","bass-baritone":"Basso-Baritono","baritone":"Baritono","tenor":"Tenore","countertenor":"Controtenore","contralto":"Contralto","mezzo-soprano":"Mezzosoprano","soprano":"Soprano"},
  },
  pt:{
    "nav-cta":"Analisar minha voz","hero-badge":"Análise vocal com IA · 12.000 artistas · 100% Grátis",
    "hero-grad":"cantor famoso","hero-title-rest":"vive na sua voz",
    "hero-desc":"Cante 10 segundos. A IA analisa seu tom, timbre e alcance vocal.",
    "btn-main":"🎤 Analisar minha voz — grátis","btn-how":"Ver como funciona","hero-sub":"Sem cadastro · Sem instalar · No celular",
    "stat1":"Artistas do mundo","stat2":"Idiomas","stat3":"Para seu resultado","stat4":"Sempre grátis",
    "app-title":"Analise sua voz","app-desc":"Selecione sua voz, envie áudio ou grave diretamente",
    "opt-default":"Selecione sua voz","opt-male":"Voz masculina","opt-female":"Voz feminina","btn-record-text":"Gravar e Analisar",
    "how-title":"Como funciona","how-sub":"Três passos. Sem cadastro.",
    "step1-t":"1. Cante alguns segundos","step1-d":"Envie áudio ou use o microfone.","step2-t":"2. A IA analisa sua voz","step2-d":"Detectamos frequência, timbre e alcance.",
    "step3-t":"3. Descubra seu cantor","step3-d":"Dizemos qual artista combina com você.",
    "voices-title":"Descubra seu tipo de voz","voices-sub":"Cada voz tem seus artistas ideais.",
    "feat-title":"Tudo do Harmiq","feat-sub":"Muito mais que um teste vocal.",
    "f1-t":"12.000 artistas","f1-d":"Do mundo todo.","f2-t":"Músicas para sua voz","f2-d":"Adaptadas ao seu alcance.",
    "f3-t":"Artistas por país","f3-d":"Filtre por região.","f4-t":"Compartilhe resultado","f4-d":"No WhatsApp, Twitter...",
    "f5-t":"Busque artista","f5-d":"Compare sua voz.","f6-t":"Privacidade","f6-d":"Áudio deletado imediatamente.",
    "cta-title":"Descubra seu tipo de voz agora","cta-desc":"Análise gratuita em 10 segundos.","cta-btn":"🎤 Analisar grátis",
    "_upload_btn":"📁 Enviar áudio","_upload_hint":"WAV · MP3 · M4A · mín. 5 seg",
    "_or":"— ou —","_analyzing":"🔍 Analisando…","_rec_stop":"⏹ Parar",
    "_result":"Seu resultado","_similarity":"similaridade","_vt_label":"Seu tipo de voz","_confidence":"confiança",
    "_share":"📲 Compartilhar","_copy":"📋 Copiar",
    "_share_txt":"🎤 Minha voz parece com {name} com {pct}% de similaridade. harmiq.app",
    "_err_short":"Áudio muito curto.","_err_silent":"Sinal muito fraco.","_err_mic":"Sem acesso ao microfone.",
    "_err_gender":"Selecione seu tipo de voz primeiro.","_err_db":"Banco de dados indisponível.",
    "_filter_era":"Época","_all_eras":"Todas as épocas",
    "_eras":{"pre-1960s":"Antes dos 60","1960s":"Anos 60","1970s-80s":"70s – 80s","1990s":"Anos 90","2000s+":"Anos 2000","2010s+":"Anos 2010+"},
    "_karaoke":"🎤 Karaoke","_platform":"🎵 Ouvir","_rec_tips":"Para melhores resultados: sem música de fundo · perto do microfone",
    "_vt_names":{"bass":"Baixo","bass-baritone":"Baixo-Barítono","baritone":"Barítono","tenor":"Tenor","countertenor":"Contratenor","contralto":"Contralto","mezzo-soprano":"Mezzossoprano","soprano":"Soprano"},
  },
  ja:{
    "nav-cta":"声を分析する","hero-badge":"AI音声分析 · 12,000アーティスト · 完全無料",
    "hero-grad":"有名アーティスト","hero-title-rest":"があなたの声に宿る",
    "hero-desc":"10秒歌うだけ。AIがあなたの音域、音色、声域を分析します。",
    "btn-main":"🎤 声を分析する — 無料","btn-how":"使い方を見る","hero-sub":"登録不要 · インストール不要 · スマホ対応",
    "stat1":"世界のアーティスト","stat2":"言語","stat3":"結果まで","stat4":"常に無料",
    "app-title":"声を分析する","app-desc":"声域を選択し音声をアップロードか録音",
    "opt-default":"声域を選択","opt-male":"男声","opt-female":"女声","btn-record-text":"録音して分析",
    "how-title":"使い方","how-sub":"3ステップ。登録不要。","step1-t":"1. 数秒歌う","step1-d":"音声ファイルをアップロードするかマイクを使用。",
    "step2-t":"2. AIが声を分析","step2-d":"基本周波数、音色、声域を検出します。","step3-t":"3. アーティストを発見","step3-d":"最も声が似ている有名アーティストを表示します。",
    "voices-title":"声域タイプを発見","voices-sub":"声域タイプによって理想の曲が異なります。",
    "feat-title":"Harmiqの全機能","feat-sub":"単純な声テスト以上のもの。",
    "f1-t":"12,000アーティスト","f1-d":"世界中から。","f2-t":"あなたの声に合う曲","f2-d":"音域に適した曲。",
    "f3-t":"国別アーティスト","f3-d":"地域でフィルタリング。","f4-t":"結果をシェア","f4-d":"LINEやTwitterでシェア。",
    "f5-t":"アーティストを検索","f5-d":"任意のアーティストと比較。","f6-t":"プライバシー保護","f6-d":"音声はすぐに削除。",
    "cta-title":"今すぐ声域を発見","cta-desc":"10秒で無料分析。","cta-btn":"🎤 無料で声を分析",
    "_upload_btn":"📁 音声をアップロード","_upload_hint":"WAV · MP3 · M4A · 最低5秒",
    "_or":"— または —","_analyzing":"🔍 分析中…","_rec_stop":"⏹ 録音停止",
    "_result":"あなたの結果","_similarity":"類似度","_vt_label":"あなたの声域","_confidence":"信頼度",
    "_share":"📲 シェア","_copy":"📋 コピー",
    "_share_txt":"🎤 私の声は{name}に{pct}%類似しています。harmiq.app",
    "_err_short":"音声が短すぎます。","_err_silent":"信号が低すぎます。","_err_mic":"マイクにアクセスできません。",
    "_err_gender":"まず声域タイプを選択してください。","_err_db":"データベースが見つかりません。",
    "_filter_era":"年代","_all_eras":"すべての年代",
    "_eras":{"pre-1960s":"60年代以前","1960s":"60年代","1970s-80s":"70–80年代","1990s":"90年代","2000s+":"2000年代","2010s+":"2010年代+"},
    "_karaoke":"🎤 カラオケ","_platform":"🎵 聴く","_rec_tips":"最良の結果のため: BGMなし · マイクに近づく · エコーを避ける",
    "_vt_names":{"bass":"バス","bass-baritone":"バス・バリトン","baritone":"バリトン","tenor":"テノール","countertenor":"カウンターテナー","contralto":"コントラルト","mezzo-soprano":"メゾソプラノ","soprano":"ソプラノ"},
  },
  ru:{
    "nav-cta":"Анализировать голос","hero-badge":"ИИ-анализ голоса · 12 000 артистов · Бесплатно",
    "hero-grad":"известный певец","hero-title-rest":"живёт в твоём голосе",
    "hero-desc":"Пой 10 секунд. ИИ анализирует тон, тембр и диапазон.",
    "btn-main":"🎤 Анализировать — бесплатно","btn-how":"Как это работает","hero-sub":"Без регистрации · Без установки",
    "stat1":"Артистов со всего мира","stat2":"Языков","stat3":"До результата","stat4":"Всегда бесплатно",
    "app-title":"Анализируй голос","app-desc":"Выбери тип голоса, загрузи или записывай",
    "opt-default":"Выбери свой голос","opt-male":"Мужской голос","opt-female":"Женский голос","btn-record-text":"Записать и анализировать",
    "how-title":"Как это работает","how-sub":"Три шага. Без регистрации.",
    "step1-t":"1. Пой несколько секунд","step1-d":"Загрузи или используй микрофон.","step2-t":"2. ИИ анализирует","step2-d":"Определяем частоту, тембр и диапазон.",
    "step3-t":"3. Узнай своего певца","step3-d":"Скажем, какой артист тебе похож.",
    "voices-title":"Узнай тип голоса","voices-sub":"У каждого типа свои идеальные песни.",
    "feat-title":"Всё что есть в Harmiq","feat-sub":"Гораздо больше простого теста.",
    "f1-t":"12 000 артистов","f1-d":"Со всего мира.","f2-t":"Песни для твоего голоса","f2-d":"Подобраны под диапазон.",
    "f3-t":"Артисты по странам","f3-d":"Фильтруй по региону.","f4-t":"Поделись результатом","f4-d":"В ВКонтакте, Telegram...",
    "f5-t":"Найди артиста","f5-d":"Сравни голос.","f6-t":"Конфиденциальность","f6-d":"Аудио удаляется сразу.",
    "cta-title":"Узнай тип голоса сейчас","cta-desc":"Бесплатный анализ за 10 секунд.","cta-btn":"🎤 Анализировать бесплатно",
    "_upload_btn":"📁 Загрузить аудио","_upload_hint":"WAV · MP3 · M4A · мин. 5 сек",
    "_or":"— или —","_analyzing":"🔍 Анализируем…","_rec_stop":"⏹ Остановить",
    "_result":"Твой результат","_similarity":"совпадение","_vt_label":"Тип голоса","_confidence":"уверенность",
    "_share":"📲 Поделиться","_copy":"📋 Копировать",
    "_share_txt":"🎤 Мой голос похож на {name} на {pct}%. harmiq.app",
    "_err_short":"Аудио слишком короткое.","_err_silent":"Сигнал слишком слабый.","_err_mic":"Нет доступа к микрофону.",
    "_err_gender":"Сначала выбери тип голоса.","_err_db":"База данных недоступна.",
    "_filter_era":"Эпоха","_all_eras":"Все эпохи",
    "_eras":{"pre-1960s":"До 60-х","1960s":"60-е","1970s-80s":"70-е – 80-е","1990s":"90-е","2000s+":"2000-е","2010s+":"2010-е+"},
    "_karaoke":"🎤 Karaoke","_platform":"🎵 Слушать","_rec_tips":"Для лучшего результата: без музыки · ближе к микрофону",
    "_vt_names":{"bass":"Бас","bass-baritone":"Бас-Баритон","baritone":"Баритон","tenor":"Тенор","countertenor":"Контртенор","contralto":"Контральто","mezzo-soprano":"Меццо-сопрано","soprano":"Сопрано"},
  },
  uk:{
    "nav-cta":"Аналізувати голос","hero-badge":"ШІ-аналіз голосу · 12 000 артистів · Безкоштовно",
    "hero-grad":"відомий співак","hero-title-rest":"живе у твоєму голосі",
    "hero-desc":"Співай 10 секунд. ШІ аналізує тон, тембр і діапазон.",
    "btn-main":"🎤 Аналізувати — безкоштовно","btn-how":"Як це працює","hero-sub":"Без реєстрації · Без встановлення",
    "stat1":"Артистів з усього світу","stat2":"Мов","stat3":"До результату","stat4":"Завжди безкоштовно",
    "app-title":"Аналізуй голос","app-desc":"Обери тип голосу, завантаж або записуй",
    "opt-default":"Обери свій голос","opt-male":"Чоловічий голос","opt-female":"Жіночий голос","btn-record-text":"Записати і аналізувати",
    "how-title":"Як це працює","how-sub":"Три кроки. Без реєстрації.",
    "step1-t":"1. Співай кілька секунд","step1-d":"Завантаж або використай мікрофон.","step2-t":"2. ШІ аналізує","step2-d":"Визначаємо частоту, тембр і діапазон.",
    "step3-t":"3. Дізнайся свого співака","step3-d":"Скажемо, який артист тобі подібний.",
    "voices-title":"Дізнайся тип голосу","voices-sub":"Кожен тип має своїх ідеальних артистів.",
    "feat-title":"Все в Harmiq","feat-sub":"Набагато більше тесту голосу.",
    "f1-t":"12 000 артистів","f1-d":"З усього світу.","f2-t":"Пісні для твого голосу","f2-d":"Підібрані під діапазон.",
    "f3-t":"Артисти за країнами","f3-d":"Фільтруй по регіону.","f4-t":"Поділись результатом","f4-d":"У Telegram, Twitter...",
    "f5-t":"Знайди артиста","f5-d":"Порівняй голос.","f6-t":"Конфіденційність","f6-d":"Аудіо видаляється одразу.",
    "cta-title":"Дізнайся тип голосу зараз","cta-desc":"Безкоштовний аналіз за 10 секунд.","cta-btn":"🎤 Аналізувати безкоштовно",
    "_upload_btn":"📁 Завантажити аудіо","_upload_hint":"WAV · MP3 · M4A · мін. 5 сек",
    "_or":"— або —","_analyzing":"🔍 Аналізуємо…","_rec_stop":"⏹ Зупинити",
    "_result":"Твій результат","_similarity":"збіг","_vt_label":"Тип голосу","_confidence":"впевненість",
    "_share":"📲 Поділитись","_copy":"📋 Копіювати",
    "_share_txt":"🎤 Мій голос схожий на {name} на {pct}%. harmiq.app",
    "_err_short":"Аудіо занадто коротке.","_err_silent":"Сигнал занадто слабкий.","_err_mic":"Немає доступу до мікрофона.",
    "_err_gender":"Спочатку обери тип голосу.","_err_db":"База даних недоступна.",
    "_filter_era":"Епоха","_all_eras":"Всі епохи",
    "_eras":{"pre-1960s":"До 60-х","1960s":"60-ті","1970s-80s":"70-ті – 80-ті","1990s":"90-ті","2000s+":"2000-ні","2010s+":"2010-ні+"},
    "_karaoke":"🎤 Karaoke","_platform":"🎵 Слухати","_rec_tips":"Для кращого результату: без музики · ближче до мікрофона",
    "_vt_names":{"bass":"Бас","bass-baritone":"Бас-Баритон","baritone":"Баритон","tenor":"Тенор","countertenor":"Контртенор","contralto":"Контральто","mezzo-soprano":"Меццо-сопрано","soprano":"Сопрано"},
  },
};

// ── Estado ───────────────────────────────────────────────────────────────────
let lang       = "es";
let singersDb  = [];
let audioBlob  = null;
let isRec      = false;
let mRec       = null;
let chunks     = [];
let analyser   = null;
let actx       = null;
let rafId      = null;
let lastResult = null;
let userCountry= "ES";
let imgCache   = {};  // cache de imágenes iTunes

// ── Helpers de traducción ─────────────────────────────────────────────────────
const tr  = k => T[lang]?.[k]       ?? T.es[k]       ?? k;
const trV = (k,v) => T[lang]?.[k]?.[v] ?? T.es[k]?.[v] ?? v;

// ═══════════════════════════════════════════════════════════════════════════════
// 1. i18n — changeLang() PUBLIC (llamado desde HTML onchange)
// ═══════════════════════════════════════════════════════════════════════════════
function changeLang(l) {
  if (!T[l]) return;
  lang = l;
  localStorage.setItem("harmiq_lang", l);
  document.documentElement.lang = l;
  const sel = document.getElementById("lang-select");
  if (sel) sel.value = l;

  // IDs estándar
  const skip = new Set(["_upload_btn","_upload_hint","_or","_analyzing","_rec_stop",
    "_result","_similarity","_vt_label","_confidence","_share","_copy","_share_txt",
    "_err_short","_err_silent","_err_mic","_err_gender","_err_db",
    "_filter_era","_all_eras","_eras","_karaoke","_platform","_rec_tips","_vt_names"]);

  for (const [id, text] of Object.entries(T[l])) {
    if (skip.has(id) || typeof text !== "string") continue;
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // Actualizar UI dinámica si ya existe
  const hint = document.getElementById("_upload_hint_el");
  if (hint) hint.textContent = tr("_upload_hint");
  const uploadBtn = document.getElementById("_upload_btn_el");
  if (uploadBtn) uploadBtn.textContent = tr("_upload_btn");
  const orEl = document.getElementById("_or_el");
  if (orEl) orEl.textContent = tr("_or");
  const tipEl = document.getElementById("_rec_tips_el");
  if (tipEl) tipEl.textContent = tr("_rec_tips");

  // Actualizar filtro de épocas
  rebuildEraFilter();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. GEOLOCALIZACIÓN (IP-based, sin permiso del navegador)
// ═══════════════════════════════════════════════════════════════════════════════
async function detectCountry() {
  try {
    const r = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
    const d = await r.json();
    userCountry = d.country_code || "ES";
    // Auto-detectar idioma si no hay preferencia guardada
    const langMap = { ES:"es",MX:"es",AR:"es",CO:"es",CL:"es",PE:"es",VE:"es",
                      CA:"ca",FR:"fr",DE:"de",AT:"de",CH:"de",IT:"it",
                      PT:"pt",BR:"pt",JP:"ja",RU:"ru",UA:"uk",GB:"en",US:"en" };
    if (!localStorage.getItem("harmiq_lang")) {
      const detected = langMap[userCountry] || "en";
      changeLang(detected);
    }
  } catch(_) { userCountry = "ES"; }
}

function getAmazonDomain() {
  const d = AMAZON_DOMAINS[userCountry];
  return d ? `amazon.${d}` : "amazon.es";
}
function getCurrencySymbol() {
  const c = { US:"$",MX:"MXN",BR:"R$",UK:"£",JP:"¥",CA:"CA$" };
  return c[userCountry] || "€";
}
function getMusicPlatform() {
  return MUSIC_PLATFORM[userCountry] || MUSIC_PLATFORM.DEFAULT;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. IMÁGENES — iTunes Search API (gratis, sin auth)
// ═══════════════════════════════════════════════════════════════════════════════
// Imágenes del monetization.json (Wikipedia, sin CORS)
const MONO_IMGS = {
  // Barítonos
  "Frank Sinatra":       "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Frank_Sinatra_-_publicity.jpg/220px-Frank_Sinatra_-_publicity.jpg",
  "Elvis Presley":       "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Elvis_Presley_promoting_Jailhouse_Rock.jpg/220px-Elvis_Presley_promoting_Jailhouse_Rock.jpg",
  "Michael Bublé":       "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Michael_Bublé_2014.jpg/220px-Michael_Bublé_2014.jpg",
  "David Bowie":         "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/David-Bowie_Chicago_2002-08-08_photoby_Adam-Bielawski_cropped.jpg/220px-David-Bowie_Chicago_2002-08-08_photoby_Adam-Bielawski_cropped.jpg",
  "Freddie Mercury":     "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Freddie_Mercury_performing_The_Works_Tour_in_New_Zealand.jpg/220px-Freddie_Mercury_performing_The_Works_Tour_in_New_Zealand.jpg",
  "Alejandro Sanz":      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Alejandro_Sanz_2019.jpg/220px-Alejandro_Sanz_2019.jpg",
  "Joaquín Sabina":      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Joaquin_Sabina_2009.jpg/220px-Joaquin_Sabina_2009.jpg",
  "Serrat":              "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Joan_Manuel_Serrat_en_2009.jpg/220px-Joan_Manuel_Serrat_en_2009.jpg",
  "Joan Manuel Serrat":  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Joan_Manuel_Serrat_en_2009.jpg/220px-Joan_Manuel_Serrat_en_2009.jpg",
  // Tenores
  "Luciano Pavarotti":   "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Luciano_Pavarotti_with_Tommy_Tune_%28cropped%29.jpg/220px-Luciano_Pavarotti_with_Tommy_Tune_%28cropped%29.jpg",
  "Pavarotti":           "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Luciano_Pavarotti_with_Tommy_Tune_%28cropped%29.jpg/220px-Luciano_Pavarotti_with_Tommy_Tune_%28cropped%29.jpg",
  "Andrea Bocelli":      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/AndreaBocelli.jpg/220px-AndreaBocelli.jpg",
  "Benson Boone":        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Benson_Boone_2024.jpg/220px-Benson_Boone_2024.jpg",
  "Camilo Sesto":        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Camilo_Sesto_2010.jpg/220px-Camilo_Sesto_2010.jpg",
  "Alejandro Fernández": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Alejandro_Fernandez_2012.jpg/220px-Alejandro_Fernandez_2012.jpg",
  "Roberto Carlos":      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Roberto_Carlos_2012.jpg/220px-Roberto_Carlos_2012.jpg",
  "Plácido Domingo":     "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Placido_Domingo_2012.jpg/220px-Placido_Domingo_2012.jpg",
  // Sopranos
  "Mariah Carey":        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Mariah_Carey_2019_by_Glenn_Francis.jpg/220px-Mariah_Carey_2019_by_Glenn_Francis.jpg",
  "Whitney Houston":     "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Whitney_Houston_Welcome_Home_Heroes_1.jpg/220px-Whitney_Houston_Welcome_Home_Heroes_1.jpg",
  "Celine Dion":         "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Celine_dion_2017.jpg/220px-Celine_dion_2017.jpg",
  "Ariana Grande":       "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Ariana_Grande_in_2019.jpg/220px-Ariana_Grande_in_2019.jpg",
  "Sabrina Carpenter":   "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Sabrina_Carpenter_2023.jpg/220px-Sabrina_Carpenter_2023.jpg",
  "María Callas":        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Maria_Callas_1957.jpg/220px-Maria_Callas_1957.jpg",
  "Montserrat Caballé":  "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Montserrat_Caballé.jpg/220px-Montserrat_Caballé.jpg",
  "Isabel Pantoja":      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Isabel_Pantoja_2011.jpg/220px-Isabel_Pantoja_2011.jpg",
  // Mezzosopranos
  "Adele":               "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Adele_2016.jpg/220px-Adele_2016.jpg",
  "Amy Winehouse":       "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Amy_Winehouse_2007.jpg/220px-Amy_Winehouse_2007.jpg",
  "Beyoncé":             "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Beyoncé_in_Cannes_%282012%29.jpg/220px-Beyoncé_in_Cannes_%282012%29.jpg",
  "Rosalía":             "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Rosal%C3%ADa_%282019%29.jpg/220px-Rosal%C3%ADa_%282019%29.jpg",
  "Tracy Chapman":       "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Tracy_Chapman_2009.jpg/220px-Tracy_Chapman_2009.jpg",
  "Billie Eilish":       "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Billie_Eilish_-_2019_by_Glenn_Francis.jpg/220px-Billie_Eilish_-_2019_by_Glenn_Francis.jpg",
  "Lana Del Rey":        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Lana_Del_Rey_2018.jpg/220px-Lana_Del_Rey_2018.jpg",
  "Norah Jones":         "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Norah_Jones_2012.jpg/220px-Norah_Jones_2012.jpg",
  // Contraltos
  "Cher":                "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Cher_2010.jpg/220px-Cher_2010.jpg",
  "Nina Simone":         "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Nina_Simone_1965.jpg/220px-Nina_Simone_1965.jpg",
  "Tina Turner":         "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Tina_Turner_-_Simply_the_Best_World_Tour.jpg/220px-Tina_Turner_-_Simply_the_Best_World_Tour.jpg",
  "Macy Gray":           "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Macy_Gray_2009.jpg/220px-Macy_Gray_2009.jpg",
  "Alanis Morissette":   "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Alanis_Morissette_2008.jpg/220px-Alanis_Morissette_2008.jpg",
  // Bajos
  "Johnny Cash":         "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Johnny_Cash_1964.jpg/220px-Johnny_Cash_1964.jpg",
  "Barry White":         "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Barry_White_1974.jpg/220px-Barry_White_1974.jpg",
  "Leonard Cohen":       "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Leonard_Cohen_at_the_Glastonbury_Festival.jpg/220px-Leonard_Cohen_at_the_Glastonbury_Festival.jpg",
  "Tom Waits":           "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Tom_Waits_2008.jpg/220px-Tom_Waits_2008.jpg",
  "Nick Cave":           "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Nick_Cave_2013.jpg/220px-Nick_Cave_2013.jpg",
  "Isaac Hayes":         "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Isaac_Hayes_1973.jpg/220px-Isaac_Hayes_1973.jpg",
  // Otros populares
  "Taylor Swift":        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/191125_Taylor_Swift_at_the_2019_American_Music_Awards_%28cropped%29.jpg/220px-191125_Taylor_Swift_at_the_2019_American_Music_Awards_%28cropped%29.jpg",
  "Ed Sheeran":          "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Ed_Sheeran_in_2017.jpg/220px-Ed_Sheeran_in_2017.jpg",
  "Bruno Mars":          "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Bruno_Mars_2013.jpg/220px-Bruno_Mars_2013.jpg",
  "Shakira":             "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Shakira_-_2010.jpg/220px-Shakira_-_2010.jpg",
  "Rihanna":             "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Rihanna_-_GQ_100_Best_Styled_People_in_Music.jpg/220px-Rihanna_-_GQ_100_Best_Styled_People_in_Music.jpg",
  "Lady Gaga":           "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Lady_Gaga_2016.jpg/220px-Lady_Gaga_2016.jpg",
  "Bad Bunny":           "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Bad_Bunny_2019.jpg/220px-Bad_Bunny_2019.jpg",
  "Maluma":              "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Maluma_2018.jpg/220px-Maluma_2018.jpg",
  "J Balvin":            "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/J_Balvin_2018.jpg/220px-J_Balvin_2018.jpg",
  "Enrique Iglesias":    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Enrique_Iglesias_2014.jpg/220px-Enrique_Iglesias_2014.jpg",
  "Ozuna":               "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Ozuna_2017.jpg/220px-Ozuna_2017.jpg",
  "Michael Jackson":     "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Michael_Jackson_in_1988.jpg/220px-Michael_Jackson_in_1988.jpg",
  "Prince":              "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Prince_at_Coachella_001.jpg/220px-Prince_at_Coachella_001.jpg",
  "Elton John":          "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Elton_John_2015.jpg/220px-Elton_John_2015.jpg",
  "Sting":               "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Sting_2017.jpg/220px-Sting_2017.jpg",
  "Mick Jagger":         "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Mick_Jagger_2019.jpg/220px-Mick_Jagger_2019.jpg",
  "Julio Iglesias":      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Julio_Iglesias_1976.jpg/220px-Julio_Iglesias_1976.jpg",
  "Enrique Bunbury":     "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Enrique_Bunbury_2012.jpg/220px-Enrique_Bunbury_2012.jpg",
  // Artistas adicionales — todos los que aparecen en la DB
  "Bob Marley":          "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Bob-Marley.jpg/220px-Bob-Marley.jpg",
  "Stevie Wonder":       "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Stevie_Wonder_at_NAMM_%28cropped%29.jpg/220px-Stevie_Wonder_at_NAMM_%28cropped%29.jpg",
  "Ray Charles":         "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Ray_Charles_1988.jpg/220px-Ray_Charles_1988.jpg",
  "James Brown":         "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/James_Brown_Live_Hamburg_1973_1.jpg/220px-James_Brown_Live_Hamburg_1973_1.jpg",
  "Bruce Springsteen":   "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Bruce_Springsteen_2012.jpg/220px-Bruce_Springsteen_2012.jpg",
  "Robert Plant":        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Robert_Plant_2009.jpg/220px-Robert_Plant_2009.jpg",
  "Jim Morrison":        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Jim_Morrison_1969.jpg/220px-Jim_Morrison_1969.jpg",
  "Kurt Cobain":         "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Kurt_Cobain_and_Krist_Novoselic_in_1991.jpg/220px-Kurt_Cobain_and_Krist_Novoselic_in_1991.jpg",
  "Eddie Vedder":        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Eddie_vedder_%28cropped%29.jpg/220px-Eddie_vedder_%28cropped%29.jpg",
  "Chris Martin":        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Chris_Martin_2015.jpg/220px-Chris_Martin_2015.jpg",
  "Thom Yorke":          "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Thom_Yorke_2013.jpg/220px-Thom_Yorke_2013.jpg",
  "John Lennon":         "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/John_Lennon_1969_%28cropped%29.jpg/220px-John_Lennon_1969_%28cropped%29.jpg",
  "Paul McCartney":      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Paul_McCartney_2.jpg/220px-Paul_McCartney_2.jpg",
  "Mick Jagger":         "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Mick_Jagger_2019.jpg/220px-Mick_Jagger_2019.jpg",
  "Bono":                "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Bono_3.jpg/220px-Bono_3.jpg",
  "Roger Daltrey":       "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Roger_Daltrey_2015.jpg/220px-Roger_Daltrey_2015.jpg",
  "David Coverdale":     "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/David_Coverdale%2C_Whitesnake.jpg/220px-David_Coverdale%2C_Whitesnake.jpg",
  "Axl Rose":            "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Axl_Rose_2016.jpg/220px-Axl_Rose_2016.jpg",
  "Jon Bon Jovi":        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Jon_Bon_Jovi_2013_%28cropped%29.jpg/220px-Jon_Bon_Jovi_2013_%28cropped%29.jpg",
  "Ronnie James Dio":    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Dio_at_Sweden_Rock_2004.jpg/220px-Dio_at_Sweden_Rock_2004.jpg",
  "Harry Styles":        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Harry_Styles_2017_crop.jpg/220px-Harry_Styles_2017_crop.jpg",
  "The Weeknd":          "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/The_Weeknd_2018.jpg/220px-The_Weeknd_2018.jpg",
  "Sam Smith":           "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Sam_Smith_2014.jpg/220px-Sam_Smith_2014.jpg",
  "Dua Lipa":            "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Dua_Lipa_2018_%28cropped%29.jpg/220px-Dua_Lipa_2018_%28cropped%29.jpg",
  "Billie Eilish":       "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Billie_Eilish_-_2019_by_Glenn_Francis.jpg/220px-Billie_Eilish_-_2019_by_Glenn_Francis.jpg",
  "Olivia Rodrigo":      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Olivia_Rodrigo_2021.jpg/220px-Olivia_Rodrigo_2021.jpg",
  "Miley Cyrus":         "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Miley_Cyrus_2019.jpg/220px-Miley_Cyrus_2019.jpg",
  "Doja Cat":            "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Doja_Cat_2020.jpg/220px-Doja_Cat_2020.jpg",
  "SZA":                 "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/SZA_2022.jpg/220px-SZA_2022.jpg",
  "Alicia Keys":         "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Alicia_Keys_2019.jpg/220px-Alicia_Keys_2019.jpg",
  "Nicki Minaj":         "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Nicki_Minaj_2013.jpg/220px-Nicki_Minaj_2013.jpg",
  "Cardi B":             "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Cardi_B_2018.jpg/220px-Cardi_B_2018.jpg",
  "Karol G":             "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/KAROL_G_2022.jpg/220px-KAROL_G_2022.jpg",
  "J Balvin":            "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/J_Balvin_2018.jpg/220px-J_Balvin_2018.jpg",
  "Rauw Alejandro":      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Rauw_Alejandro_2022.jpg/220px-Rauw_Alejandro_2022.jpg",
  "Marc Anthony":        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Marc_Anthony_2015.jpg/220px-Marc_Anthony_2015.jpg",
  "Romeo Santos":        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Romeo_Santos_2014.jpg/220px-Romeo_Santos_2014.jpg",
  "Daddy Yankee":        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Daddy_Yankee_-_Atlantic_2019.jpg/220px-Daddy_Yankee_-_Atlantic_2019.jpg",
  "Camilo":              "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Camilo_2020.jpg/220px-Camilo_2020.jpg",
  "Maluma":              "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Maluma_2018.jpg/220px-Maluma_2018.jpg",
  "Jhay Cortez":         "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Jhay_Cortez_2022.jpg/220px-Jhay_Cortez_2022.jpg",
  "Myke Towers":         "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Myke_Towers_2020.jpg/220px-Myke_Towers_2020.jpg",
  "Anuel AA":            "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Anuel_AA_2019.jpg/220px-Anuel_AA_2019.jpg",
  "Peso Pluma":          "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Peso_Pluma_2023.jpg/220px-Peso_Pluma_2023.jpg",
  "Eros Ramazzotti":     "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Eros_Ramazzotti_2012.jpg/220px-Eros_Ramazzotti_2012.jpg",
  "Laura Pausini":       "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Laura_Pausini_2019.jpg/220px-Laura_Pausini_2019.jpg",
  "Andrea Bocelli":      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/AndreaBocelli.jpg/220px-AndreaBocelli.jpg",
  "Stromae":             "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Stromae_%28cropped%29.jpg/220px-Stromae_%28cropped%29.jpg",
  "Edith Piaf":          "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Edith_Piaf.jpg/220px-Edith_Piaf.jpg",
  "Angèle":              "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Ang%C3%A8le_-_Musilac_2019_%28cropped%29.jpg/220px-Ang%C3%A8le_-_Musilac_2019_%28cropped%29.jpg",
  "Alla Pugacheva":      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Alla_Pugacheva_2016.jpg/220px-Alla_Pugacheva_2016.jpg",
  "Utada Hikaru":        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Hikaru_Utada_2018.jpg/220px-Hikaru_Utada_2018.jpg",
  "IU":                  "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/IU_%28Lee_Ji-eun%29_at_2019_Golden_Disc_Awards.jpg/220px-IU_%28Lee_Ji-eun%29_at_2019_Golden_Disc_Awards.jpg",
  "BTS":                 "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/BTS_at_the_37th_Golden_Disc_Awards.jpg/220px-BTS_at_the_37th_Golden_Disc_Awards.jpg",
  "Jungkook (BTS)":      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Jungkook_Kim_at_the_White_House_%28cropped%29.jpg/220px-Jungkook_Kim_at_the_White_House_%28cropped%29.jpg",
  "PSY":                 "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/PSY_2012_MIC_05.jpg/220px-PSY_2012_MIC_05.jpg",
  "Jay Chou":            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Jay_Chou_2013.jpg/220px-Jay_Chou_2013.jpg",
  "Teresa Teng":         "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Teresa_Teng.jpg/220px-Teresa_Teng.jpg",
  "Faye Wong":           "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Faye_Wong.jpg/220px-Faye_Wong.jpg",
  "A.R. Rahman":         "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/AR_Rahman_2010.jpg/220px-AR_Rahman_2010.jpg",
  "Lata Mangeshkar":     "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Lata_Mangeshkar.jpg/220px-Lata_Mangeshkar.jpg",
  "Cesária Évora":       "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Cesaria_evora_festivaldelhumour.jpg/220px-Cesaria_evora_festivaldelhumour.jpg",
  "Youssou N'Dour":      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Youssou_N%27Dour_2012.jpg/220px-Youssou_N%27Dour_2012.jpg",
  "Miriam Makeba":       "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Miriam_Makeba2.jpg/220px-Miriam_Makeba2.jpg",
  "Amy Lee":             "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Amy_Lee_of_Evanescence.jpg/220px-Amy_Lee_of_Evanescence.jpg",
  "Gwen Stefani":        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Gwen_Stefani_2014_%28cropped%29.jpg/220px-Gwen_Stefani_2014_%28cropped%29.jpg",
  "Sia":                 "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Sia_2016.jpg/220px-Sia_2016.jpg",
  "Lorde":               "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Lorde_2017.jpg/220px-Lorde_2017.jpg",
  "Grimes":              "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Grimes_2016.jpg/220px-Grimes_2016.jpg",
  "Björk":               "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Bjork-IMG_1317_%28cropped%29.jpg/220px-Bjork-IMG_1317_%28cropped%29.jpg",
  "Donna Summer":        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Donna_Summer_1978.jpg/220px-Donna_Summer_1978.jpg",
  "Cyndi Lauper":        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Cyndi_Lauper_2016_%28cropped%29.jpg/220px-Cyndi_Lauper_2016_%28cropped%29.jpg",
  "Gloria Gaynor":       "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Gloria_Gaynor_2009.jpg/220px-Gloria_Gaynor_2009.jpg",
  "Aretha Franklin":     "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Aretha_Franklin_1968.jpg/220px-Aretha_Franklin_1968.jpg",
  "Lauryn Hill":         "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Lauryn_Hill.jpg/220px-Lauryn_Hill.jpg",
  "Janis Joplin":        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Janis_Joplin_1970_%28cropped%29.jpg/220px-Janis_Joplin_1970_%28cropped%29.jpg",
  "Patti Smith":         "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Patti_Smith_1976.jpg/220px-Patti_Smith_1976.jpg",
  // Artistas catalanes
  "Oques Grasses":       "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Oques_Grasses_2019.jpg/220px-Oques_Grasses_2019.jpg",
  "The Tyets":           "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/The_Tyets_2021.jpg/220px-The_Tyets_2021.jpg",
  "Rosalía":             "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Rosal%C3%ADa_%282019%29.jpg/220px-Rosal%C3%ADa_%282019%29.jpg",
  "Alejandro Sanz":      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Alejandro_Sanz_2019.jpg/220px-Alejandro_Sanz_2019.jpg",
};

// Generar avatar con iniciales si no hay foto
function getInitialsAvatar(name) {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase()
    : name.substring(0,2).toUpperCase();
  const colors = ['#7C4DFF','#FF4FA3','#118AB2','#FF9F1C','#06D6A0','#E63946'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" rx="60" fill="${color}"/><text x="60" y="75" font-family="Arial" font-weight="bold" font-size="42" fill="white" text-anchor="middle">${initials}</text></svg>`)}`;
}

// ── Spotify token (Client Credentials) ──────────────────────────────────
// Rellena con tus credenciales de Spotify Developer
// https://developer.spotify.com/dashboard
const HF_IMG_CACHE = {};  // cache imágenes vía backend HF

// Fotos de artistas vía backend HF — los secrets de Spotify están en HF, NUNCA aquí
async function getSpotifyImageFromBackend(name) {
  if (HF_IMG_CACHE[name]) return HF_IMG_CACHE[name];
  try {
    const base = HF_API_URL.replace("/analyze", "");
    const r = await fetch(`${base}/artist-image?name=${encodeURIComponent(name)}`, {
      signal: AbortSignal.timeout(3500)
    });
    if (!r.ok) return null;
    const d = await r.json();
    if (d.url) { HF_IMG_CACHE[name] = d.url; return d.url; }
  } catch(_) {}
  return null;
}

async function getArtistImage(name) {
  if (imgCache[name]) return imgCache[name];

  // 1. Mapa local Wikipedia (instantáneo, sin red)
  if (MONO_IMGS[name]) {
    imgCache[name] = MONO_IMGS[name];
    return MONO_IMGS[name];
  }

  // 2. Foto vía backend HF (Spotify seguro — secrets en HF, no en frontend)
  const backendImg = await getSpotifyImageFromBackend(name);
  if (backendImg) { imgCache[name] = backendImg; return backendImg; }

  // 3. Deezer API pública (no requiere auth, permite CORS)
  try {
    const q = encodeURIComponent(name);
    const r = await fetch(
      `https://api.deezer.com/search/artist?q=${q}&limit=1`,
      { signal: AbortSignal.timeout(4000) }
    );
    const d = await r.json();
    const img = d.data?.[0]?.picture_medium || d.data?.[0]?.picture;
    if (img) { imgCache[name] = img; return img; }
  } catch(_) {}

  // 4. Fallback: avatar con iniciales coloreadas
  const initImg = getInitialsAvatar(name);
  imgCache[name] = initImg;
  return initImg;
}

async function preloadImages(names) {
  await Promise.allSettled(names.map(n => getArtistImage(n)));
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. INYECTAR UI (upload + era filter + spectrum + tips)
// ═══════════════════════════════════════════════════════════════════════════════
function injectUI() {
  const appBox = document.querySelector(".app-box");
  if (!appBox || document.getElementById("_harmiq_ui_injected")) return;
  appBox.setAttribute("id", "_harmiq_ui_injected");

  // ── Tip de grabación ───────────────────────────────────────────────────
  const tipDiv = document.createElement("div");
  tipDiv.id = "_rec_tips_el";
  tipDiv.style.cssText = "background:rgba(124,77,255,.1);border:1px solid rgba(124,77,255,.25);border-radius:10px;padding:.6rem 1rem;font-size:.8rem;color:#a89fff;margin-bottom:1.2rem;text-align:center;";
  tipDiv.textContent = tr("_rec_tips");

  // ── Zona de subida ─────────────────────────────────────────────────────
  const uploadWrap = document.createElement("div");
  uploadWrap.style.cssText = "margin-bottom:1rem;";
  uploadWrap.innerHTML = `
    <div id="_drop_zone" style="border:2px dashed rgba(255,255,255,.18);border-radius:14px;padding:1.4rem;
      text-align:center;cursor:pointer;transition:all .2s;background:rgba(255,255,255,.02);">
      <input type="file" id="_file_inp" accept="audio/*" style="display:none">
      <div style="font-size:1.6rem;margin-bottom:.4rem">🎵</div>
      <div id="_upload_btn_el" style="font-weight:700;color:#7C4DFF;font-size:.95rem;">${tr("_upload_btn")}</div>
      <div id="_upload_hint_el" style="font-size:.75rem;color:#6B7280;margin-top:.2rem;">${tr("_upload_hint")}</div>
      <div id="_file_name" style="margin-top:.4rem;font-size:.82rem;color:#7C4DFF;font-weight:600;"></div>
    </div>
    <div id="_or_el" style="text-align:center;color:#6B7280;font-size:.82rem;margin:.7rem 0;">${tr("_or")}</div>`;

  // ── Canvas espectro ────────────────────────────────────────────────────
  const specWrap = document.createElement("div");
  specWrap.id = "_spec_wrap";
  specWrap.style.cssText = "display:none;margin:.8rem 0;";
  specWrap.innerHTML = `<canvas id="_spec_canvas" style="width:100%;height:72px;border-radius:12px;background:rgba(255,255,255,.04);display:block;"></canvas>`;

  // ── Botones género visuales ───────────────────────────────────────────
  const genderBtns = document.createElement("div");
  genderBtns.style.cssText = "display:flex;gap:.6rem;margin-bottom:1.2rem;";
  genderBtns.innerHTML = `
    <button onclick="_setGender('male',this)" style="flex:1;padding:.65rem;border-radius:12px;
      border:2px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#9CA3AF;
      font-family:'Nunito',sans-serif;font-weight:700;font-size:.9rem;cursor:pointer;transition:all .2s"
      id="_gbtn_male">
      🎭 Hombre
    </button>
    <button onclick="_setGender('female',this)" style="flex:1;padding:.65rem;border-radius:12px;
      border:2px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#9CA3AF;
      font-family:'Nunito',sans-serif;font-weight:700;font-size:.9rem;cursor:pointer;transition:all .2s"
      id="_gbtn_female">
      ✨ Mujer
    </button>
    <button onclick="_setGender('auto',this)" style="flex:1;padding:.65rem;border-radius:12px;
      border:2px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#9CA3AF;
      font-family:'Nunito',sans-serif;font-weight:700;font-size:.9rem;cursor:pointer;transition:all .2s"
      id="_gbtn_auto">
      🎤 Auto
    </button>`;

  // ── Insertar en el DOM ─────────────────────────────────────────────────
  const genderRow = document.querySelector("[id='user-gender']")?.closest("div");
  const recRow    = document.getElementById("record-btn")?.closest("div");
  // Marcar botó com "no llest" fins que carregui la DB
  const recBtnEl = document.getElementById("record-btn");
  if (recBtnEl) { recBtnEl.style.opacity = "0.7"; recBtnEl.title = "Cargando base de datos..."; }
  if (genderRow && recRow) {
    // Ocultar el select original (lo mantenemos para compatibilidad)
    if (genderRow) genderRow.style.display = "none";
    genderRow.parentNode.insertBefore(tipDiv,      genderRow);
    genderRow.parentNode.insertBefore(genderBtns,  genderRow);
    genderRow.parentNode.insertBefore(uploadWrap,  recRow);
    recRow.parentNode.insertBefore(specWrap, recRow.nextSibling);
  }

  // ── Eventos drop zone ──────────────────────────────────────────────────
  const dz = document.getElementById("_drop_zone");
  const fi = document.getElementById("_file_inp");
  dz.addEventListener("click", () => fi.click());
  dz.addEventListener("dragover", e => { e.preventDefault(); dz.style.borderColor="#7C4DFF"; dz.style.background="rgba(124,77,255,.07)"; });
  dz.addEventListener("dragleave", () => { dz.style.borderColor="rgba(255,255,255,.18)"; dz.style.background="rgba(255,255,255,.02)"; });
  dz.addEventListener("drop", e => {
    e.preventDefault(); dz.style.borderColor="rgba(255,255,255,.18)"; dz.style.background="rgba(255,255,255,.02)";
    const f = e.dataTransfer.files[0];
    if (f?.type?.startsWith("audio/")) setFile(f);
  });
  fi.addEventListener("change", () => { if (fi.files[0]) setFile(fi.files[0]); });

  // ── Filtro de épocas (se añade después del resultado) ─────────────────
  // Se inyecta en renderResults()
}

function _setGender(val, btn) {
  // Actualizar select oculto
  const sel = document.getElementById("user-gender");
  if (sel) sel.value = val;
  // Actualizar botones visuales
  ["male","female","auto"].forEach(v => {
    const b = document.getElementById(`_gbtn_${v}`);
    if (!b) return;
    const active = v === val;
    b.style.borderColor   = active ? "#7C4DFF" : "rgba(255,255,255,.12)";
    b.style.background    = active ? "rgba(124,77,255,.2)" : "rgba(255,255,255,.04)";
    b.style.color         = active ? "#A5B4FC" : "#9CA3AF";
  });
}

function setFile(f) {
  audioBlob = f;
  const fn = document.getElementById("_file_name");
  if (fn) fn.textContent = `✓ ${f.name}`;
  const dz = document.getElementById("_drop_zone");
  if (dz) { dz.style.borderColor="#7C4DFF"; dz.style.background="rgba(124,77,255,.06)"; }
  showStatus("");
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. VISUALIZADOR DE ESPECTRO
// ═══════════════════════════════════════════════════════════════════════════════
function startSpectrum(stream) {
  const wrap   = document.getElementById("_spec_wrap");
  const canvas = document.getElementById("_spec_canvas");
  if (!wrap || !canvas) return;
  wrap.style.display = "block";

  const dpr = window.devicePixelRatio || 1;
  canvas.width  = canvas.offsetWidth  * dpr || 300 * dpr;
  canvas.height = canvas.offsetHeight * dpr || 72  * dpr;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  actx    = new (window.AudioContext || window.webkitAudioContext)();
  const src = actx.createMediaStreamSource(stream);
  analyser = actx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.82;
  src.connect(analyser);

  const buf = new Uint8Array(analyser.frequencyBinCount);

  function draw() {
    rafId = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(buf);
    ctx.fillStyle = "rgba(13,13,26,.35)";
    ctx.fillRect(0, 0, W, H);
    const bw = W / buf.length * 1.8;
    buf.forEach((v, i) => {
      const pct = v / 255;
      const h   = pct * H;
      const r   = Math.round(124 + (255-124)*pct);
      const g   = Math.round(77  * (1-pct));
      const b   = Math.round(255 * (1-pct*.6));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(i * bw, H - h, bw - 1, h);
      if (pct > .05) {
        ctx.fillStyle = `rgba(255,255,255,${pct*.7})`;
        ctx.fillRect(i * bw, H - h - 2*dpr, bw - 1, 2*dpr);
      }
    });
  }
  draw();
}

function stopSpectrum() {
  if (rafId)   { cancelAnimationFrame(rafId); rafId = null; }
  if (analyser){ analyser.disconnect(); analyser = null; }
  if (actx)    { actx.close(); actx = null; }
  const w = document.getElementById("_spec_wrap");
  if (w) w.style.display = "none";
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. GRABACIÓN
// ═══════════════════════════════════════════════════════════════════════════════
async function toggleRecording() {
  const btn  = document.getElementById("record-btn");
  const txt  = document.getElementById("btn-record-text");
  let gender = document.getElementById("user-gender")?.value;
  if (!gender) {
    gender = "auto";
    const sel = document.getElementById("user-gender");
    if (sel) sel.value = "auto";
    _setGender("auto", document.getElementById("_gbtn_auto"));
  }

  if (!isRec) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      chunks = []; isRec = true;
      btn.style.background = "linear-gradient(135deg,#ff4757,#ff6b9d)";
      txt.textContent = tr("_rec_stop");
      showStatus(tr("_analyzing"));
      startSpectrum(stream);

      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus"
                 : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "audio/wav";
      mRec = new MediaRecorder(stream, { mimeType: mime });
      mRec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      mRec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        stopSpectrum();
        const blob = new Blob(chunks, { type: mRec.mimeType || "audio/wav" });
        const ext  = (mRec.mimeType||"").includes("webm") ? "webm" : (mRec.mimeType||"").includes("mp4") ? "mp4" : "wav";
        blob.name = `rec.${ext}`;
        setFile(blob);
        await analyzeAudio();
      };
      mRec.start(100);
    } catch(e) { showStatus(tr("_err_mic"), "err"); }
  } else {
    isRec = false;
    btn.style.background = "";
    txt.textContent = tr("btn-record-text");
    if (mRec?.state !== "inactive") mRec.stop();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. DSP LOCAL
// ═══════════════════════════════════════════════════════════════════════════════
async function extractFeatures(blob) {
  const ab  = await blob.arrayBuffer();
  const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate:22050 });
  let buf;
  try { buf = await ctx.decodeAudioData(ab); } finally { ctx.close(); }

  const sr = buf.sampleRate, data = buf.getChannelData(0);
  const dur = buf.duration;
  if (dur < 2.5) throw new Error(tr("_err_short"));

  let sq = 0;
  for (let i=0;i<data.length;i++) sq += data[i]*data[i];
  const rms = Math.sqrt(sq/data.length);
  if (rms < 0.008) throw new Error(tr("_err_silent"));

  // Pitch via YIN
  const fSz=2048, hop=512, fMin=65, fMax=1400;
  const pitches=[];
  for (let s=0;s+fSz<data.length;s+=hop) {
    const frame = data.slice(s,s+fSz);
    const fRms  = Math.sqrt(frame.reduce((a,v)=>a+v*v,0)/frame.length);
    if (fRms<.006) continue;
    const tMin=Math.floor(sr/fMax), tMax=Math.min(Math.floor(sr/fMin),fSz>>1);
    const cmnd=new Float32Array(tMax+1); cmnd[0]=1;
    let run=0;
    for (let tau=1;tau<=tMax;tau++) {
      let d=0;
      for (let j=0;j<fSz-tau;j++) { const x=frame[j]-frame[j+tau]; d+=x*x; }
      run+=d; cmnd[tau]=run>0?d*tau/run:1;
    }
    for (let tau=tMin+1;tau<tMax;tau++) {
      if (cmnd[tau]<.15&&cmnd[tau]<cmnd[tau-1]&&cmnd[tau]<=cmnd[tau+1]) {
        const t2=tau+(cmnd[tau-1]-cmnd[tau+1])/(2*(cmnd[tau-1]-2*cmnd[tau]+cmnd[tau+1]));
        const f=sr/Math.max(t2,1);
        if (f>fMin&&f<fMax) { pitches.push(f); break; }
      }
    }
  }
  if (pitches.length<5) pitches.push(150);
  pitches.sort((a,b)=>a-b);
  const n=pitches.length;
  const pm=pitches.reduce((a,v)=>a+v,0)/n;
  const ps=Math.sqrt(pitches.reduce((a,v)=>a+(v-pm)**2,0)/n);
  const p10=pitches[Math.floor(n*.10)], p90=pitches[Math.floor(n*.90)];

  // Spectral centroid (DFT parcial)
  const seg=data.slice(0,Math.min(4096,data.length));
  const sLen=seg.length;
  let totM=0,wF=0;
  const fBin=sr/sLen;
  for (let k=0;k<=Math.min(sLen>>1,512);k++) {
    let re=0,im=0;
    for (let j=0;j<sLen;j++) {
      const w=.5-.5*Math.cos(2*Math.PI*j/(sLen-1));
      const a=-2*Math.PI*k*j/sLen;
      re+=seg[j]*w*Math.cos(a); im+=seg[j]*w*Math.sin(a);
    }
    const m=Math.sqrt(re*re+im*im);
    totM+=m; wF+=k*fBin*m;
  }
  const centroid = totM>1e-10 ? wF/totM : 2000;

  // ZCR
  let zc=0;
  for (let i=1;i<data.length;i++) if((data[i]>=0)!==(data[i-1]>=0)) zc++;
  const zcr=zc/data.length;

  return { pitchMean:pm, pitchStd:ps, pitchRange:p90-p10, centroid, rms, zcr, rolloff:centroid*2, duration:dur };
}

function featuresToVector(f) {
  const NR={pitch_mean:[65,520],pitch_std:[0,80],pitch_range:[0,600],
    spectral_centroid:[200,5500],energy_rms:[.001,.3],zcr:[.01,.35],spectral_rolloff:[500,8000]};
  const n=(v,k)=>{ const [lo,hi]=NR[k]; return Math.max(0,Math.min(1,(v-lo)/(hi-lo||1))); };
  const pn=n(f.pitchMean,"pitch_mean"),bn=n(f.centroid,"spectral_centroid"),
        en=n(f.rms,"energy_rms"),rn=n(f.pitchRange,"pitch_range");
  const sc=[n(f.pitchMean,"pitch_mean"),n(f.pitchStd,"pitch_std"),n(f.pitchRange,"pitch_range"),
            n(f.centroid,"spectral_centroid"),n(f.rms,"energy_rms"),n(f.zcr,"zcr"),n(f.rolloff,"spectral_rolloff")];
  const mfcc=[Math.min(1,en),Math.min(1,1-bn),Math.min(1,pn*.85+.08),Math.min(1,pn*.70+.12),
    Math.min(1,pn*.55+.18),Math.min(1,bn*.60+.20),Math.min(1,rn*.50+.25),
    Math.min(1,(pn+bn)*.40+.15),Math.min(1,en*.45+.22),Math.min(1,(1-pn)*.35+.28),
    Math.min(1,bn*.30+.32),Math.min(1,rn*.25+.35)];
  let seed=Math.floor(f.pitchMean*100+f.centroid)%2147483647;
  for(let i=0;i<8;i++){ seed=(seed*1664525+1013904223)&0x7fffffff; mfcc.push(Math.max(.2,Math.min(.65,.40+(seed/0x7fffffff-.5)*.16))); }
  return [...sc,...mfcc];
}

function classifyVT(pm, pr, gender) {
  // pr = pitch_range (p90-p10). Barítonos tienen rango menor que tenores.
  // Umbral barítono elevado a 215 Hz + discriminación por pitch_range en zona ambigua
  let vt, c, s;
  const isMale = gender==="male" || (gender==="auto" && pm < 215);
  if (isMale) {
    if      (pm < 110) { vt="bass";          c=90;  s=20; }
    else if (pm < 145) { vt="bass-baritone"; c=125; s=18; }
    else if (pm < 215) { vt="baritone";      c=175; s=32; }
    else if (pm < 290) {
      // Zona ambigua 215-290: usar pitch_range para discriminar
      // Barítono: rango típico < 280 Hz | Tenor: rango > 280 Hz
      vt = (pr > 0 && pr < 280) ? "baritone" : "tenor";
      c  = vt === "baritone" ? 200 : 250; s = 35;
    }
    else               { vt="tenor";         c=260; s=40; }
  } else {
    if      (pm < 210) { vt="contralto";     c=185; s=25; }
    else if (pm < 270) { vt="mezzo-soprano"; c=245; s=30; }
    else if (pm < 350) { vt="soprano";       c=300; s=38; }
    else               { vt="soprano";       c=380; s=55; }
  }
  return { vt, conf:Math.min(95,Math.round(100*Math.exp(-.5*((pm-c)/s)**2))) };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. MATCHING
// ═══════════════════════════════════════════════════════════════════════════════
const VTS ={bass:1,"bass-baritone":2,baritone:3,tenor:4,countertenor:5,contralto:3,"mezzo-soprano":4,soprano:6};
const VTP =[1,.92,.82,.74,.68,.62];
const SWN =[.28,.07,.12,.20,.08,.05,.05].map((w,_,a)=>w/a.reduce((s,v)=>s+v));

function score(uVec,sVec,uvt,svt) {
  if(!uVec||!sVec||uVec.length!==sVec.length) return 0;
  const su=uVec.slice(0,7),ss=sVec.slice(0,7),mu=uVec.slice(7),ms=sVec.slice(7);
  let wdSq=0;
  for(let i=0;i<7;i++){ const d=su[i]-ss[i]; if(isFinite(d)) wdSq+=SWN[i]*d*d; }
  let dot=0,nU=0,nS=0;
  for(let i=0;i<mu.length;i++){ dot+=mu[i]*ms[i];nU+=mu[i]**2;nS+=ms[i]**2; }
  const cos=(nU>1e-8&&nS>1e-8)?dot/(Math.sqrt(nU)*Math.sqrt(nS)):.5;
  let sim=.35*cos+.65*Math.exp(-3*Math.sqrt(wdSq));
  const u=VTS[uvt]||0,s2=VTS[svt]||0;
  if(u&&s2) sim*=(VTP[Math.abs(u-s2)]??0.60);
  return Math.max(0,Math.min(100,sim*100));
}

function getMatches(vec,vt,gender,filters={},topN=5) {
  let pool = gender ? singersDb.filter(s=>s.gender===gender) : singersDb;
  if(pool.length<5) pool=singersDb;

  // Aplicar filtros
  if(filters.era) {
    // "1970s" y "1980s" ambos mapean a "1970s-80s" en la DB
    const eraMap = {"1970s":"1970s-80s","1980s":"1970s-80s","2020s":"2010s+"};
    const dbEra  = eraMap[filters.era] || filters.era;
    pool = pool.filter(s => s.era === dbEra || s.era === filters.era);
  }
  if(filters.genre_category) pool=pool.filter(s=>s.genre_category===filters.genre_category);
  if(filters.country_code)   pool=pool.filter(s=>s.country_code===filters.country_code);

  // Si los filtros dejan muy poco, usar pool más amplio
  if(pool.length<3) {
    pool = gender ? singersDb.filter(s=>s.gender===gender) : singersDb;
  }
  if(pool.length<3) pool=singersDb;

  // Score base de popularidad por país del usuario
  const countryBonus = (s) => s.country_code === userCountry ? 1.03 : 1.0;

  const scored=pool
    .map(s=>({
      ...s,
      score:Math.round(score(vec,s.vector,vt,s.voice_type)*countryBonus(s)*10)/10
    }))
    .sort((a,b)=>b.score-a.score);

  if(!scored[0]) return [];

  const out=[scored[0]]; const seen=new Set([scored[0]?.voice_type]);
  for(const s of scored.slice(1)){
    const e={...s};
    if(seen.has(e.voice_type)&&(out[out.length-1].score-e.score)<3)
      e.score=Math.round(e.score*.92*10)/10;
    out.push(e); seen.add(e.voice_type);
    if(out.length>=topN) break;
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9. ANÁLISIS
// ═══════════════════════════════════════════════════════════════════════════════
async function analyzeAudio() {
  const gender = document.getElementById("user-gender")?.value;
  if (!gender)    { showStatus(tr("_err_gender"),"err"); return; }
  if (!audioBlob) { showStatus(tr("_err_short"),"err"); return; }
  if (!singersDb.length){ showStatus(tr("_err_db"),"err"); return; }
  showStatus(tr("_analyzing"));
  try {
    const feat = await extractFeatures(audioBlob);
    const vec  = featuresToVector(feat);
    const {vt,conf} = classifyVT(feat.pitchMean,feat.pitchRange,gender);
    const matches = getMatches(vec,vt,gender,{},5);
    lastResult = {feat,vec,vt,conf,matches,gender};
    await preloadImages(matches.slice(0,5).map(m=>m.name));
    renderResults(lastResult);
    // Persistir resultado en sessionStorage para cuando vuelvan
    try {
      const toSave = {
        feat: lastResult.feat,
        vt:   lastResult.vt,
        conf: lastResult.conf,
        gender: lastResult.gender,
        matches: lastResult.matches.map(m => ({
          id:m.id, name:m.name, voice_type:m.voice_type,
          genre_category:m.genre_category, country_code:m.country_code,
          era:m.era, score:m.score,
          reference_songs: m.reference_songs?.slice(0,3) || []
        }))
      };
      sessionStorage.setItem("harmiq_result", JSON.stringify(toSave));
    } catch(_) {}
    showStatus("");
  } catch(e) { showStatus(e.message||tr("_err_short"),"err"); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 10. RENDERIZAR RESULTADOS
// ═══════════════════════════════════════════════════════════════════════════════
function getPlatformLinks(singerName, songName) {
  const platform = getMusicPlatform();
  const q        = encodeURIComponent(`${singerName} ${songName||""}`);
  const qs       = encodeURIComponent(`${singerName} ${songName||""} karaoke`);

  const links = {
    spotify:   `https://open.spotify.com/search/${q}`,
    apple:     `https://music.apple.com/search?term=${q}`,
    youtube:   `https://www.youtube.com/results?search_query=${qs}`,
    line:      `https://music.line.me/search?type=track&q=${q}`,
    melon:     `https://www.melon.com/search/total/index.htm?q=${q}`,
  };

  const platformLabel = { spotify:"Spotify", apple:"Apple Music", youtube:"YouTube", line:"LINE Music", melon:"Melon" };
  const platformColor = { spotify:"#1DB954", apple:"#fc3c44", youtube:"#FF0000", line:"#00B900", melon:"#00CD3C" };

  return {
    karaoke:      links.youtube,
    stream:       links[platform] || links.spotify,
    streamLabel:  platformLabel[platform] || "Spotify",
    streamColor:  platformColor[platform] || "#1DB954",
  };
}

function rebuildEraFilter() {
  const sel = document.getElementById("_era_filter");
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = `<option value="">${tr("_all_eras")}</option>`;
  const eras = ["pre-1960s","1960s","1970s-80s","1990s","2000s+","2010s+"];
  eras.filter(e=>singersDb.some(s=>s.era===e)).forEach(e=>{
    const o = document.createElement("option");
    o.value = e; o.textContent = trV("_eras",e);
    if (e===current) o.selected = true;
    sel.appendChild(o);
  });
}

async function renderResults({feat,vt,conf,matches,gender}) {
  const vtName = trV("_vt_names",vt);
  const sym    = ["🥇","🥈","🥉","4.","5."];

  // ── Inyectar filtro de épocas si no existe ─────────────────────────────
  const resEl = document.getElementById("results");
  if (!resEl) return;

  let filtersHTML = "";
  const eras       = [...new Set(singersDb.map(s=>s.era).filter(Boolean))];
  // Épocas mostradas al usuario (incluye mapeos de DB)
  // Épocas disponibles en DB (mostramos todas las que existen)
  const ERA_DISPLAY = [
    {val:"pre-1960s",  label:"Clásicos pre-60"},
    {val:"1950s",      label:"Los 50"},
    {val:"1960s",      label:"Los 60"},
    {val:"1970s",      label:"Los 70"},
    {val:"1970s-80s",  label:"70s y 80s"},
    {val:"1980s",      label:"Los 80"},
    {val:"1990s",      label:"Los 90"},
    {val:"2000s+",     label:"Años 2000"},
    {val:"2010s+",     label:"Años 2010"},
    {val:"2020s",      label:"Años 2020"},
  ];
  // Solo mostrar épocas que realmente tienen artistas en la DB
  const eraOptions = ERA_DISPLAY
    .filter(e => singersDb.some(s => s.era === e.val))
    .map(e => `<option value="${e.val}">${e.label}</option>`).join("");

  // Géneros disponibles en DB
  const genreOptions = [...new Set(singersDb.map(s=>s.genre_category).filter(Boolean))].sort()
    .map(g => `<option value="${g}">${g.charAt(0).toUpperCase()+g.slice(1).replace('-',' ')}</option>`).join("");

  // Países para filtro de idioma (top 15)
  const topCountries = {
    "ES":"🇪🇸 Español","CAT":"🏴 Català","EU":"🇪🇺 Euskera","GL":"🏳️ Galego",
    "US":"🇺🇸 English","UK":"🇬🇧 British","MX":"🇲🇽 México",
    "AR":"🇦🇷 Argentina","CO":"🇨🇴 Colombia","BR":"🇧🇷 Português",
    "FR":"🇫🇷 Français","IT":"🇮🇹 Italiano","DE":"🇩🇪 Deutsch",
    "JP":"🇯🇵 日本語","KR":"🇰🇷 한국어","PT":"🇵🇹 Portugal",
    "LATAM":"🌎 Latinoamérica","INT":"🌍 Internacional"
  };
  const countryOptions = Object.entries(topCountries)
    .filter(([cc]) => singersDb.some(s=>s.country_code===cc))
    .map(([cc,lbl]) => `<option value="${cc}">${lbl}</option>`).join("");

  filtersHTML = `
    <div id="_filters_row" style="margin-bottom:1.25rem;padding:.9rem;
      background:rgba(255,255,255,.04);border-radius:14px;border:1px solid rgba(255,255,255,.08)">
      <div style="font-size:.72rem;color:#6B7280;font-weight:700;text-transform:uppercase;
        letter-spacing:.06em;margin-bottom:.7rem">🎛️ Filtrar resultados</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:.5rem">
        <div>
          <div style="font-size:.68rem;color:#6B7280;margin-bottom:.2rem">Época</div>
          <select id="_era_filter" style="width:100%;background:#13102a;border:1px solid rgba(255,255,255,.15);
            color:#E5E7EB;font-size:.8rem;padding:.32rem .55rem;border-radius:8px;cursor:pointer">
            <option value="">${tr("_all_eras")}</option>
            ${eraOptions}
          </select>
        </div>
        <div>
          <div style="font-size:.68rem;color:#6B7280;margin-bottom:.2rem">Género musical</div>
          <select id="_genre_filter" style="width:100%;background:#13102a;border:1px solid rgba(255,255,255,.15);
            color:#E5E7EB;font-size:.8rem;padding:.32rem .55rem;border-radius:8px;cursor:pointer">
            <option value="">Todos</option>
            ${genreOptions}
          </select>
        </div>
        <div>
          <div style="font-size:.68rem;color:#6B7280;margin-bottom:.2rem">Idioma / País</div>
          <select id="_country_filter" style="width:100%;background:#13102a;border:1px solid rgba(255,255,255,.15);
            color:#E5E7EB;font-size:.8rem;padding:.32rem .55rem;border-radius:8px;cursor:pointer">
            <option value="">Todos</option>
            ${countryOptions}
          </select>
        </div>
      </div>
    </div>`;

  // ── Cards de artistas ──────────────────────────────────────────────────
  const cardsHTML = matches.map((m,i) => {
    const pct  = Math.round(m.score);
    const img  = imgCache[m.name] || null;
    const song = m.reference_songs?.[0] || m.name;
    const {karaoke, stream, streamLabel, streamColor} = getPlatformLinks(m.name, song);
    const vtN  = trV("_vt_names", m.voice_type);

    return `
    <div style="background:rgba(255,255,255,.05);border:1px solid ${i===0?"rgba(124,77,255,.45)":"rgba(255,255,255,.08)"};
      border-radius:16px;padding:1rem 1.1rem;display:flex;gap:.9rem;align-items:flex-start;
      ${i===0?"background:rgba(124,77,255,.07);":""}" >

      <!-- Foto del artista -->
      <div style="width:56px;height:56px;border-radius:50%;overflow:hidden;flex-shrink:0;
        background:linear-gradient(135deg,rgba(124,77,255,.3),rgba(255,79,163,.3));">
        <img src="${img || getInitialsAvatar(m.name)}" alt="${m.name}"
          style="width:100%;height:100%;object-fit:cover;"
          onerror="this.src=getInitialsAvatar('${m.name.replace(/'/g,"\\'")}')">
      </div>

      <!-- Info -->
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.15rem">
          <span style="font-size:1.1rem">${sym[i]}</span>
          <span style="font-family:'Baloo 2',sans-serif;font-weight:700;font-size:1rem;
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.name}</span>
        </div>
        <div style="font-size:.72rem;color:#6B7280;margin-bottom:.5rem;text-transform:capitalize">
          ${vtN}${m.genre_category?" · "+m.genre_category:""}${m.era?" · "+trV("_eras",m.era):""}
        </div>

        <!-- Barra similitud -->
        <div style="height:4px;background:rgba(255,255,255,.08);border-radius:2px;margin-bottom:.5rem">
          <div style="height:4px;width:${pct}%;background:linear-gradient(90deg,#7C4DFF,#FF4FA3);border-radius:2px"></div>
        </div>

        <!-- Canción referencia -->
        ${m.reference_songs?.length?`<div style="font-size:.72rem;color:#6B7280;margin-bottom:.55rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">🎵 ${m.reference_songs.slice(0,2).join(" · ")}</div>`:""}

        <!-- Botones plataforma -->
        <div style="display:flex;gap:.4rem;flex-wrap:wrap">
          <a href="${karaoke}" target="_blank" rel="noopener"
            style="display:inline-flex;align-items:center;gap:.3rem;font-size:.75rem;font-weight:700;
            padding:.3rem .65rem;border-radius:20px;background:rgba(255,0,0,.15);color:#ff4444;
            text-decoration:none;border:1px solid rgba(255,0,0,.25);transition:opacity .2s;"
            onmouseover="this.style.opacity='.75'" onmouseout="this.style.opacity='1'">
            ▶ ${tr("_karaoke")}
          </a>
          <a href="${stream}" target="_blank" rel="noopener"
            style="display:inline-flex;align-items:center;gap:.3rem;font-size:.75rem;font-weight:700;
            padding:.3rem .65rem;border-radius:20px;background:${streamColor}22;color:${streamColor};
            text-decoration:none;border:1px solid ${streamColor}44;transition:opacity .2s;"
            onmouseover="this.style.opacity='.75'" onmouseout="this.style.opacity='1'">
            🎵 ${streamLabel}
          </a>
        </div>
      </div>

      <!-- % Score -->
      <div style="text-align:right;flex-shrink:0">
        <div style="font-family:'Baloo 2',sans-serif;font-weight:800;font-size:1.35rem;
          background:linear-gradient(135deg,#7C4DFF,#FF4FA3);-webkit-background-clip:text;
          -webkit-text-fill-color:transparent">${pct}%</div>
        <div style="font-size:.68rem;color:#6B7280">${tr("_similarity")}</div>
      </div>
    </div>`;
  }).join("");

  // ── Botones Home Studio + Ko-fi ─────────────────────────────────────
  const extraBtnsHTML = `
    <div style="margin-bottom:1rem;padding-top:.75rem;border-top:1px solid rgba(255,255,255,.06)">
      <div style="font-size:.68rem;color:#6B7280;text-transform:uppercase;letter-spacing:.06em;
        font-weight:700;margin-bottom:.5rem">🔗 Explorar más</div>
      <div style="display:flex;gap:.45rem;flex-wrap:wrap">
        <a href="/home-studio"
          style="display:inline-flex;align-items:center;gap:.35rem;padding:.48rem .85rem;
          background:rgba(124,77,255,.12);border:1px solid rgba(124,77,255,.28);border-radius:10px;
          text-decoration:none;color:#A5B4FC;font-size:.78rem;font-weight:700;transition:all .2s"
          onmouseover="this.style.background='rgba(124,77,255,.22)'"
          onmouseout="this.style.background='rgba(124,77,255,.12)'">
          🎛️ Home Studio
        </a>
        <a href="/karaoke-eventos"
          style="display:inline-flex;align-items:center;gap:.35rem;padding:.48rem .85rem;
          background:rgba(255,79,163,.1);border:1px solid rgba(255,79,163,.25);border-radius:10px;
          text-decoration:none;color:#FF9FCC;font-size:.78rem;font-weight:700;transition:all .2s"
          onmouseover="this.style.background='rgba(255,79,163,.2)'"
          onmouseout="this.style.background='rgba(255,79,163,.1)'">
          🎤 Buscar Karaoke
        </a>
        <a href="/tipos-de-voz"
          style="display:inline-flex;align-items:center;gap:.35rem;padding:.48rem .85rem;
          background:rgba(6,214,160,.1);border:1px solid rgba(6,214,160,.25);border-radius:10px;
          text-decoration:none;color:#06D6A0;font-size:.78rem;font-weight:700;transition:all .2s"
          onmouseover="this.style.background='rgba(6,214,160,.2)'"
          onmouseout="this.style.background='rgba(6,214,160,.1)'">
          📖 Tipos de Voz
        </a>
        <a href="/ejercicios-de-canto"
          style="display:inline-flex;align-items:center;gap:.35rem;padding:.48rem .85rem;
          background:rgba(255,209,102,.1);border:1px solid rgba(255,209,102,.25);border-radius:10px;
          text-decoration:none;color:#FFD166;font-size:.78rem;font-weight:700;transition:all .2s"
          onmouseover="this.style.background='rgba(255,209,102,.2)'"
          onmouseout="this.style.background='rgba(255,209,102,.1)'">
          🎯 Ejercicios de Canto
        </a>
        <a href="/modul-catala"
          style="display:inline-flex;align-items:center;gap:.35rem;padding:.48rem .85rem;
          background:rgba(207,20,43,.1);border:1px solid rgba(207,20,43,.25);border-radius:10px;
          text-decoration:none;color:#ff8a94;font-size:.78rem;font-weight:700;transition:all .2s"
          onmouseover="this.style.background='rgba(207,20,43,.2)'"
          onmouseout="this.style.background='rgba(207,20,43,.1)'">
          🏴 Música en Català
        </a>
        <a href="https://ko-fi.com/harmiq" target="_blank" rel="noopener"
          style="display:inline-flex;align-items:center;gap:.35rem;padding:.48rem .85rem;
          background:rgba(255,94,91,.1);border:1px solid rgba(255,94,91,.25);border-radius:10px;
          text-decoration:none;color:#ff9896;font-size:.78rem;font-weight:700;transition:all .2s"
          onmouseover="this.style.background='rgba(255,94,91,.2)'"
          onmouseout="this.style.background='rgba(255,94,91,.1)'">
          ☕ Apoya Harmiq
        </a>
      </div>
    </div>`;

  // ── Canciones recomendadas de Spotify ────────────────────────────────
  const topMatch  = matches[0];
  const songRefs  = topMatch?.reference_songs?.slice(0,3) || [];
  const spPlatform= getMusicPlatform();
  const spColor   = {spotify:"#1DB954",apple:"#fc3c44",line:"#00B900",melon:"#00CD3C"}[spPlatform]||"#1DB954";
  const spLabel   = {spotify:"Spotify",apple:"Apple Music",line:"LINE Music",melon:"Melon"}[spPlatform]||"Spotify";
  const spLinks   = {
    spotify: n => `https://open.spotify.com/search/${encodeURIComponent(n)}`,
    apple:   n => `https://music.apple.com/search?term=${encodeURIComponent(n)}`,
    line:    n => `https://music.line.me/search?type=track&q=${encodeURIComponent(n)}`,
    melon:   n => `https://www.melon.com/search/total/index.htm?q=${encodeURIComponent(n)}`,
  };
  const getLnk = spLinks[spPlatform] || spLinks.spotify;

  const songsHTML = songRefs.length ? `
    <div style="border-top:1px solid rgba(255,255,255,.08);padding-top:1.1rem;margin-top:.5rem;margin-bottom:.5rem">
      <p style="font-size:.8rem;color:#6B7280;margin-bottom:.6rem">
        🎵 Canciones de <strong style="color:#E5E7EB">${topMatch.name}</strong> para practicar tu voz
      </p>
      <div style="display:flex;flex-direction:column;gap:.35rem">
        ${songRefs.map(s => {
          const title = typeof s === 'object' ? s.title : s;
          const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(title+' karaoke')}`;
          const stUrl = getLnk(topMatch.name + ' ' + title);
          return `<div style="display:flex;align-items:center;gap:.5rem;padding:.45rem .7rem;
            background:rgba(255,255,255,.04);border-radius:9px;font-size:.82rem">
            <span style="color:#7C4DFF">🎵</span>
            <span style="flex:1;font-weight:600">${title}</span>
            <a href="${ytUrl}" target="_blank" style="background:rgba(255,0,0,.12);color:#ff4444;
              font-size:.68rem;font-weight:700;padding:.18rem .5rem;border-radius:20px;
              text-decoration:none;border:1px solid rgba(255,0,0,.2)">▶ Karaoke</a>
            <a href="${stUrl}" target="_blank" style="background:${spColor}18;color:${spColor};
              font-size:.68rem;font-weight:700;padding:.18rem .5rem;border-radius:20px;
              text-decoration:none;border:1px solid ${spColor}33">${spLabel}</a>
          </div>`;
        }).join("")}
      </div>
    </div>` : "";

  // ── Share buttons ──────────────────────────────────────────────────────
  const shareHTML = `
    <div style="border-top:1px solid rgba(255,255,255,.08);padding-top:1.1rem;margin-top:.25rem">
      <p style="font-size:.82rem;color:#6B7280;margin-bottom:.65rem">${tr("_share")}</p>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap">
        <button onclick="_share('wa')"   style="${_btnStyle('#25D366')}">💬 WhatsApp</button>
        <button onclick="_share('x')"    style="${_btnStyle('#000','1px solid #333')}">🐦 Twitter/X</button>
        <button onclick="_share('cp')"   style="${_btnStyle('rgba(124,77,255,.2)','1px solid rgba(124,77,255,.3)')}">📋 ${tr("_copy")}</button>
        <button onclick="_share('card')" style="${_btnStyle('linear-gradient(135deg,#7C4DFF,#FF4FA3)')}">🃏 Tarjeta viral</button>
      </div>
    </div>`;

  resEl.innerHTML = `
    <!-- Header resultado -->
    <div style="margin-bottom:1.25rem">
      <span style="background:rgba(124,77,255,.15);border:1px solid rgba(124,77,255,.3);
        color:#a89fff;font-size:.78rem;font-weight:700;padding:.28rem .75rem;border-radius:20px">
        ⚡ ${tr("_result")}
      </span>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-top:1rem">
        <div style="background:rgba(255,255,255,.05);border-radius:12px;padding:.9rem;text-align:center">
          <div style="font-size:.68rem;color:#6B7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.2rem">${tr("_vt_label")}</div>
          <div style="font-family:'Baloo 2',sans-serif;font-weight:800;font-size:1.25rem;
            background:linear-gradient(135deg,#7C4DFF,#FF4FA3);-webkit-background-clip:text;
            -webkit-text-fill-color:transparent;text-transform:capitalize">${vtName}</div>
          <div style="color:#6B7280;font-size:.72rem">${conf}% ${tr("_confidence")}</div>
        </div>
        <div style="background:rgba(255,255,255,.05);border-radius:12px;padding:.9rem;text-align:center">
          <div style="font-size:.68rem;color:#6B7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.2rem">Pitch</div>
          <div style="font-family:'Baloo 2',sans-serif;font-weight:800;font-size:1.25rem;color:#7C4DFF">
            ${Math.round(feat.pitchMean)} Hz</div>
          <div style="color:#6B7280;font-size:.72rem">±${Math.round(feat.pitchRange/2)} Hz</div>
        </div>
      </div>
    </div>
    ${filtersHTML}
    <div style="display:flex;flex-direction:column;gap:.75rem;margin-bottom:1rem">${cardsHTML}</div>
    ${extraBtnsHTML}
    ${songsHTML}
    ${shareHTML}`;

  // ── Evento filtro época ────────────────────────────────────────────────
  const applyFilters = async () => {
    const eraVal  = document.getElementById("_era_filter")?.value    || "";
    const genre   = document.getElementById("_genre_filter")?.value  || "";
    const country = document.getElementById("_country_filter")?.value|| "";
    // Mapear era UI → era DB
    const ERA_MAP  = {"1970s":"1970s-80s","1980s":"1970s-80s","2020s":"2010s+","2026":"2010s+"};
    const era      = ERA_MAP[eraVal] || eraVal;
    const filters = {};
    if (era)     filters.era            = era;
    if (genre)   filters.genre_category = genre;
    if (country) filters.country_code   = country;
    const newMatches = getMatches(lastResult.vec, lastResult.vt, lastResult.gender, filters, 5);
    await preloadImages(newMatches.map(m=>m.name));
    lastResult.matches = newMatches;
    await renderResults(lastResult);
  };
  const eraF     = document.getElementById("_era_filter");
  const genreF   = document.getElementById("_genre_filter");
  const countryF = document.getElementById("_country_filter");
  if (eraF)     eraF.addEventListener("change",     applyFilters);
  if (genreF)   genreF.addEventListener("change",   applyFilters);
  if (countryF) countryF.addEventListener("change", applyFilters);

  // Scroll al resultado
  resEl.scrollIntoView({ behavior:"smooth", block:"start" });

  // ── Sección karaoke y eventos (en #events-area) ──────────────────────────
  const evEl = document.getElementById("events-area");
  if (evEl) {
    const vtSlug = {
      "baritone":"baritono","bass":"bajo","bass-baritone":"bajo",
      "tenor":"tenor","soprano":"soprano","mezzo-soprano":"mezzo-soprano",
      "contralto":"contralto","countertenor":"tenor"
    }[vt] || "baritono";
    evEl.innerHTML = buildKaraokeSection(vtName, vtSlug);
  }
}

// ── Constructor de sección karaoke (reutilizable en resultado y páginas SEO) ──
function buildKaraokeSection(vtName, vtSlug) {
  return `
  <div style="margin-top:1.5rem">
    <div style="background:rgba(255,255,255,.04);border-radius:18px;
      border:1px solid rgba(255,255,255,.08);overflow:hidden">

      <!-- Header karaoke -->
      <div style="padding:1.1rem 1.25rem;border-bottom:1px solid rgba(255,255,255,.06);
        display:flex;align-items:center;gap:.7rem">
        <span style="font-size:1.5rem">🎤</span>
        <div>
          <h3 style="font-family:'Baloo 2',sans-serif;font-weight:700;font-size:1rem;margin-bottom:.1rem">
            Karaoke — Encuentra dónde cantar
          </h3>
          <p style="font-size:.75rem;color:#6B7280">
            Karaokes, open mics, jam sessions y plataformas online
          </p>
        </div>
      </div>

      <div style="padding:1.1rem 1.25rem">

        <!-- Buscador de locales -->
        <div style="margin-bottom:1.1rem">
          <div style="font-size:.8rem;font-weight:700;color:#A5B4FC;margin-bottom:.5rem">
            📍 Busca locales y eventos cerca de ti
          </div>
          <div style="display:flex;gap:.4rem">
            <input id="_karaoke_city" placeholder="Tu ciudad (ej: Madrid)"
              style="flex:1;background:#13102a;border:1px solid rgba(255,255,255,.15);color:#E5E7EB;
              font-size:.85rem;padding:.5rem .8rem;border-radius:10px;font-family:'Nunito',sans-serif;
              outline:none" />
            <button onclick="_searchKaraoke()" 
              style="background:linear-gradient(135deg,#7C4DFF,#FF4FA3);color:#fff;border:none;
              padding:.5rem 1rem;border-radius:10px;font-weight:700;font-size:.82rem;cursor:pointer;
              white-space:nowrap">Buscar</button>
          </div>
        </div>

        <!-- Resultados de búsqueda -->
        <div id="_karaoke_results" style="display:none;margin-bottom:1rem">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem">
            <a id="_kr_bars" href="#" target="_blank" rel="noopener"
              style="padding:.7rem;background:rgba(255,159,28,.08);border:1px solid rgba(255,159,28,.2);
              border-radius:10px;text-decoration:none;color:#E5E7EB;display:flex;flex-direction:column;gap:.2rem">
              <span style="font-size:1rem">🍺</span>
              <span style="font-size:.78rem;font-weight:700">Bares de karaoke</span>
              <span style="font-size:.65rem;color:#6B7280">Ver en Google Maps →</span>
            </a>
            <a id="_kr_mics" href="#" target="_blank" rel="noopener"
              style="padding:.7rem;background:rgba(124,77,255,.08);border:1px solid rgba(124,77,255,.2);
              border-radius:10px;text-decoration:none;color:#E5E7EB;display:flex;flex-direction:column;gap:.2rem">
              <span style="font-size:1rem">🎸</span>
              <span style="font-size:.78rem;font-weight:700">Open mics & jams</span>
              <span style="font-size:.65rem;color:#6B7280">Ver en Google Maps →</span>
            </a>
            <a id="_kr_companies" href="#" target="_blank" rel="noopener"
              style="padding:.7rem;background:rgba(29,185,84,.08);border:1px solid rgba(29,185,84,.2);
              border-radius:10px;text-decoration:none;color:#E5E7EB;display:flex;flex-direction:column;gap:.2rem">
              <span style="font-size:1rem">🏢</span>
              <span style="font-size:.78rem;font-weight:700">Empresas karaoke</span>
              <span style="font-size:.65rem;color:#6B7280">Ver en Google Maps →</span>
            </a>
            <a id="_kr_events" href="#" target="_blank" rel="noopener"
              style="padding:.7rem;background:rgba(255,79,163,.08);border:1px solid rgba(255,79,163,.2);
              border-radius:10px;text-decoration:none;color:#E5E7EB;display:flex;flex-direction:column;gap:.2rem">
              <span style="font-size:1rem">🎭</span>
              <span style="font-size:.78rem;font-weight:700">Concursos canto</span>
              <span style="font-size:.65rem;color:#6B7280">Ver en Eventbrite →</span>
            </a>
          </div>
        </div>

        <!-- Karaoke online -->
        <div style="margin-bottom:1rem">
          <div style="font-size:.78rem;font-weight:700;color:#A5B4FC;margin-bottom:.6rem">
            💻 Karaoke online — Desde casa o con amigos
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:.4rem">
            ${[
              {icon:"▶️",name:"YouTube Karaoke",desc:"La mayor biblioteca gratuita",url:"https://www.youtube.com/results?search_query=karaoke+"+encodeURIComponent(vtName),color:"rgba(255,0,0,.15)",border:"rgba(255,0,0,.25)"},
              {icon:"🌟",name:"Singa",desc:"Catálogo actualizado",url:"https://singa.com",color:"rgba(255,159,28,.1)",border:"rgba(255,159,28,.25)"},
              {icon:"🎤",name:"Smule",desc:"Karaoke social con duetos",url:"https://www.smule.com",color:"rgba(124,77,255,.1)",border:"rgba(124,77,255,.25)"},
              {icon:"⭐",name:"StarMaker",desc:"Efectos de voz y comunidad",url:"https://www.starmaker.us",color:"rgba(255,215,0,.1)",border:"rgba(255,215,0,.25)"},
              {icon:"🎵",name:"KaraFun",desc:"+50.000 canciones",url:"https://www.karafun.es",color:"rgba(29,185,84,.1)",border:"rgba(29,185,84,.25)"},
              {icon:"📱",name:"Yokee",desc:"Karaoke gratis en móvil",url:"https://yokee.tv",color:"rgba(0,153,255,.1)",border:"rgba(0,153,255,.25)"},
            ].map(p=>`
              <a href="${p.url}" target="_blank" rel="noopener"
                style="display:flex;align-items:center;gap:.5rem;padding:.6rem;
                background:${p.color};border:1px solid ${p.border};border-radius:10px;
                text-decoration:none;color:#E5E7EB;transition:opacity .15s"
                onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'">
                <span style="font-size:1rem">${p.icon}</span>
                <div>
                  <div style="font-size:.75rem;font-weight:700">${p.name}</div>
                  <div style="font-size:.62rem;color:#6B7280">${p.desc}</div>
                </div>
              </a>`).join("")}
          </div>
        </div>

        <!-- Consejos para cantar en público -->
        <details style="border-top:1px solid rgba(255,255,255,.06);padding-top:.9rem">
          <summary style="font-size:.8rem;font-weight:700;color:#A5B4FC;cursor:pointer;
            list-style:none;display:flex;align-items:center;gap:.4rem">
            <span>💡</span> Consejos para cantar en público <span style="margin-left:auto;font-size:.7rem;color:#6B7280">▼ Ver</span>
          </summary>
          <div style="margin-top:.75rem;display:flex;flex-direction:column;gap:.5rem">
            ${[
              ["🎙️","Elige canciones dentro de tu rango","No elijas la canción más difícil. Elige una que domines bien — el público lo agradece más que un intento fallido de un hit imposible."],
              ["🌡️","Calienta la voz antes","5 minutos de escalas suaves antes de subir al escenario marcan una diferencia enorme. El humming (boca cerrada) es perfecto."],
              ["🎤","Domina el micrófono","Mantén el micro a 5-10 cm de la boca. Aléjalo un poco en los agudos, acércalo en los graves. No lo tapes con la mano."],
              ["👀","Mira al público","No te claves en la pantalla. Léela de reojo y conecta con el público. Una sonrisa vale más que la nota perfecta."],
              ["🍵","Hidratación y temperatura","Agua a temperatura ambiente, no fría. El alcohol reseca las cuerdas vocales. Un té con miel es tu mejor aliado."],
            ].map(([ico,tit,desc])=>`
              <div style="display:flex;gap:.6rem;padding:.6rem;background:rgba(255,255,255,.03);
                border-radius:10px;border:1px solid rgba(255,255,255,.05)">
                <span style="font-size:1rem;flex-shrink:0">${ico}</span>
                <div>
                  <div style="font-size:.78rem;font-weight:700;margin-bottom:.15rem">${tit}</div>
                  <div style="font-size:.72rem;color:#6B7280;line-height:1.4">${desc}</div>
                </div>
              </div>`).join("")}
          </div>
        </details>

      </div>
    </div>
  </div>`;
}

function _btnStyle(bg, border="none") {
  return `flex:1;min-width:88px;background:${bg};border:${border};color:#fff;font-family:'Nunito',sans-serif;
    font-weight:700;font-size:.82rem;padding:.55rem .7rem;border-radius:10px;cursor:pointer;transition:opacity .2s;`;
}

function _share(p) {
  if (!lastResult?.matches?.[0]) return;
  const m   = lastResult.matches[0];
  const pct = Math.round(m.score);
  const txt = tr("_share_txt").replace("{name}",m.name).replace("{pct}",pct);
  if (p==="wa") window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank");
  if (p==="x")  window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(txt)}`, "_blank");
  if (p==="cp") navigator.clipboard.writeText(txt).then(()=>{ showStatus("✅ Copiado!"); setTimeout(()=>showStatus(""),2e3); });
  if (p==="card") showViralCard();
}

function showViralCard() {
  if (!lastResult) return;
  const {vt, conf, matches} = lastResult;
  const vtName = trV("_vt_names", vt);
  const top3   = matches.slice(0,3);
  const vtColors = {
    "baritone":"#7C4DFF","bass":"#1E3A5F","bass-baritone":"#2d4d8f",
    "tenor":"#118AB2","soprano":"#FF4FA3","mezzo-soprano":"#FF9F1C",
    "contralto":"#80B918","countertenor":"#06D6A0"
  };
  const color = vtColors[vt] || "#7C4DFF";

  const phrases = {
    "baritone":["Tu voz tiene el poder de un clásico 🎭","Freddie Mercury era barítono. ¿Y tú? 🤘","La voz más versátil del mundo. Úsala 🎤"],
    "tenor":   ["Tu voz llega donde otros no pueden ✨","El Do de pecho es tu territorio 🏆","Los tenores hacen historia 🎼"],
    "soprano": ["Tu voz es pura magia ✨","Mariah Carey empezó como tú 🌟","Las sopranos conquistan el mundo 👑"],
    "mezzo-soprano":["Adele cambió el mundo con esta voz 💜","La más expresiva del espectro 🎶","Tu timbre es único e irrepetible 🔥"],
    "contralto":["Una rareza vocal privilegiada 🌿","Nina Simone tenía tu voz 🎹","Tu registro grave es tu superpoder 💚"],
    "bass":    ["Los graves más poderosos del mundo 🎸","Johnny Cash tenía tu voz 🖤","Tu voz hace temblar el escenario ⚡"],
    "bass-baritone":["Voz imponente y única 💙","Entre los graves y la versatilidad 🎵","Tu rango es la envidia de muchos 🎭"],
    "countertenor":["La voz más sorprendente del mundo 🌈","Tu falsetto es tu mayor tesoro 💎","Una rareza vocal extraordinaria ⭐"],
  };
  const phraseArr = phrases[vt] || ["Tu voz es única 🎤","Nadie canta como tú 🌟","El mundo necesita tu voz 🎵"];
  const phrase = phraseArr[Math.floor(Math.random() * phraseArr.length)];

  // Top artista para foto grande
  const top1 = top3[0];
  const top1Img = MONO_IMGS[top1?.name] || imgCache[top1?.name] || getInitialsAvatar(top1?.name||"?");

  const artistRows = top3.map((m,i) => {
    const img = MONO_IMGS[m.name] || imgCache[m.name] || getInitialsAvatar(m.name);
    const pct = Math.round(m.score);
    const medals = ["🥇","🥈","🥉"];
    const sizes = ["18px","14px","13px"];
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:${i===0?'10px 12px':'7px 12px'};
        background:${i===0?'rgba(255,255,255,.13)':'rgba(255,255,255,.06)'};
        border-radius:14px;margin-bottom:7px;
        ${i===0?'border:1px solid rgba(255,255,255,.2);':''} ">
        <span style="font-size:${i===0?'22px':'17px'}">${medals[i]}</span>
        <div style="width:${i===0?'48px':'38px'};height:${i===0?'48px':'38px'};
          border-radius:50%;overflow:hidden;flex-shrink:0;
          border:2px solid ${i===0?color:'rgba(255,255,255,.2)'}">
          <img src="${img}" alt="${m.name}" style="width:100%;height:100%;object-fit:cover"
            onerror="this.src='${getInitialsAvatar(m.name)}'">
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:${i===0?'800':'700'};font-size:${sizes[i]};
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
            color:${i===0?'#fff':'rgba(255,255,255,.85)'}">${m.name}</div>
          <div style="font-size:10px;color:rgba(255,255,255,.5);text-transform:capitalize">
            ${trV("_vt_names",m.voice_type)}</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:800;font-size:${i===0?'22px':'16px'};
            background:linear-gradient(135deg,#fff,${color});
            -webkit-background-clip:text;-webkit-text-fill-color:transparent">${pct}%</div>
        </div>
      </div>`;
  }).join("");

  // Texto para compartir
  const shareText = `🎤 Mi voz es de ${vtName} y me parezco a ${top1?.name} con ${Math.round(top1?.score||0)}% de similitud. ¡Descubre el tuyo! 👉 harmiq.app`;

  const modal = document.createElement("div");
  modal.id = "_viral_modal";
  modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;overflow-y:auto;";

  modal.innerHTML = `
    <div style="max-width:360px;width:100%;margin:auto">

      <!-- TARJETA VIRAL -->
      <div id="_viral_card" style="
        background:linear-gradient(170deg,#0f0820 0%,#1a0a35 35%,#0a1228 70%,#050510 100%);
        border-radius:28px;padding:24px 20px 20px;color:#fff;
        border:1px solid rgba(255,255,255,.15);
        box-shadow:0 24px 80px rgba(0,0,0,.7), 0 0 0 1px ${color}44;
        font-family:'Nunito',sans-serif;
        position:relative;overflow:hidden;">

        <!-- Destellos de fondo -->
        <div style="position:absolute;top:-80px;right:-50px;width:220px;height:220px;
          border-radius:50%;background:radial-gradient(circle,${color}35 0%,transparent 70%);pointer-events:none"></div>
        <div style="position:absolute;bottom:-60px;left:-40px;width:180px;height:180px;
          border-radius:50%;background:radial-gradient(circle,#FF4FA355 0%,transparent 70%);pointer-events:none"></div>
        <div style="position:absolute;top:50%;left:-30px;width:100px;height:100px;
          border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.03) 0%,transparent 70%);pointer-events:none"></div>

        <!-- Top bar -->
        <div style="display:flex;align-items:center;justify-content:space-between;
          margin-bottom:18px;position:relative">
          <div>
            <div style="font-size:9px;font-weight:800;letter-spacing:.18em;
              color:rgba(255,255,255,.4);text-transform:uppercase">¿A QUÉ CANTANTE</div>
            <div style="font-size:9px;font-weight:800;letter-spacing:.18em;
              color:rgba(255,255,255,.4);text-transform:uppercase">TE PARECES?</div>
          </div>
          <div style="background:linear-gradient(135deg,${color},#FF4FA3);
            padding:4px 12px;border-radius:20px;font-size:10px;font-weight:800;
            letter-spacing:.05em">harmiq.app</div>
        </div>

        <!-- Tipo de voz grande -->
        <div style="text-align:center;margin-bottom:16px;position:relative">
          <div style="font-size:10px;color:rgba(255,255,255,.45);text-transform:uppercase;
            letter-spacing:.12em;margin-bottom:2px">Tu tipo de voz</div>
          <div style="font-family:'Baloo 2',sans-serif;font-weight:900;
            font-size:clamp(36px,10vw,48px);line-height:1;
            background:linear-gradient(135deg,#ffffff 30%,${color} 70%,#FF4FA3 100%);
            -webkit-background-clip:text;-webkit-text-fill-color:transparent;
            text-transform:capitalize;margin-bottom:4px">${vtName}</div>
          <div style="display:inline-flex;align-items:center;gap:6px;
            background:rgba(255,255,255,.08);padding:3px 10px;border-radius:20px">
            <div style="width:6px;height:6px;border-radius:50%;background:${color}"></div>
            <span style="font-size:11px;color:rgba(255,255,255,.6)">${conf}% confianza</span>
          </div>
        </div>

        <!-- Artistas top 3 -->
        <div style="margin-bottom:14px;position:relative">
          ${artistRows}
        </div>

        <!-- Frase motivadora -->
        <div style="text-align:center;padding:12px 8px;
          background:rgba(255,255,255,.05);border-radius:14px;
          border:1px solid rgba(255,255,255,.08);position:relative;margin-bottom:14px">
          <div style="font-size:12px;color:rgba(255,255,255,.8);
            font-style:italic;line-height:1.5">${phrase}</div>
        </div>

        <!-- Footer CTA -->
        <div style="text-align:center;position:relative">
          <div style="font-size:11px;color:rgba(255,255,255,.4);margin-bottom:4px">
            Descubre el tuyo gratis en
          </div>
          <div style="font-family:'Baloo 2',sans-serif;font-weight:900;font-size:18px;
            background:linear-gradient(135deg,${color},#FF4FA3);
            -webkit-background-clip:text;-webkit-text-fill-color:transparent">
            🎙️ harmiq.app
          </div>
        </div>
      </div>

      <!-- BOTONES COMPARTIR -->
      <div style="margin-top:12px;background:rgba(255,255,255,.05);
        border-radius:20px;padding:14px;border:1px solid rgba(255,255,255,.08)">
        <p style="text-align:center;font-size:.75rem;color:#6B7280;margin-bottom:10px;font-weight:600">
          📲 Comparte tu resultado
        </p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.45rem">
          <button onclick="_shareCard('wa')"
            style="background:#25D366;color:#fff;border:none;padding:.6rem .5rem;border-radius:12px;
            font-weight:700;font-size:.8rem;cursor:pointer;display:flex;align-items:center;
            justify-content:center;gap:.3rem;transition:opacity .2s"
            onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
            💬 WhatsApp
          </button>
          <button onclick="_shareCard('tg')"
            style="background:#229ED9;color:#fff;border:none;padding:.6rem .5rem;border-radius:12px;
            font-weight:700;font-size:.8rem;cursor:pointer;display:flex;align-items:center;
            justify-content:center;gap:.3rem"
            onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
            ✈️ Telegram
          </button>
          <button onclick="_shareCard('x')"
            style="background:#000;color:#fff;border:1px solid #333;padding:.6rem .5rem;border-radius:12px;
            font-weight:700;font-size:.8rem;cursor:pointer;display:flex;align-items:center;
            justify-content:center;gap:.3rem"
            onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
            🐦 Twitter/X
          </button>
          <button onclick="_shareCard('ig')"
            style="background:linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);
            color:#fff;border:none;padding:.6rem .5rem;border-radius:12px;
            font-weight:700;font-size:.8rem;cursor:pointer;display:flex;align-items:center;
            justify-content:center;gap:.3rem"
            onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
            📸 Instagram
          </button>
          <button onclick="_shareCard('cp')"
            style="background:rgba(124,77,255,.25);color:#a89fff;
            border:1px solid rgba(124,77,255,.35);padding:.6rem .5rem;border-radius:12px;
            font-weight:700;font-size:.8rem;cursor:pointer;display:flex;align-items:center;
            justify-content:center;gap:.3rem"
            onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
            📋 Copiar texto
          </button>
          <button onclick="document.getElementById('_viral_modal').remove()"
            style="background:rgba(255,255,255,.06);color:#6B7280;
            border:1px solid rgba(255,255,255,.08);padding:.6rem .5rem;border-radius:12px;
            font-weight:700;font-size:.8rem;cursor:pointer;display:flex;align-items:center;
            justify-content:center;gap:.3rem">
            ✕ Cerrar
          </button>
        </div>
        <p style="text-align:center;font-size:.68rem;color:#4B5563;margin-top:8px">
          💡 Haz captura de pantalla para compartir la tarjeta como imagen
        </p>
      </div>
    </div>`;

  document.body.appendChild(modal);
  modal.addEventListener("click", e => { if(e.target===modal) modal.remove(); });
}

function _shareCard(p) {
  if (!lastResult?.matches?.[0]) return;
  const m   = lastResult.matches[0];
  const pct = Math.round(m.score);
  const vtn = trV("_vt_names", lastResult.vt);
  const url = "https://harmiq.app";
  const txt = `🎤 Tengo voz de ${vtn} y me parezco a ${m.name} con un ${pct}% de similitud. ¿A qué cantante te pareces tú? 👉 ${url}`;
  if (p==="wa") window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank");
  if (p==="tg") window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(txt)}`, "_blank");
  if (p==="x")  window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(txt)}`, "_blank");
  if (p==="ig") {
    // Instagram no tiene API de compartir directa; copiar texto y abrir Instagram
    navigator.clipboard.writeText(txt).then(()=>{
      showStatus("✅ Texto copiado — pégalo en Instagram Stories");
      setTimeout(()=>{
        window.open("https://www.instagram.com/", "_blank");
      }, 800);
      setTimeout(()=>showStatus(""),4000);
    });
  }
  if (p==="cp") navigator.clipboard.writeText(txt).then(()=>{
    showStatus("✅ Texto copiado al portapapeles");
    setTimeout(()=>showStatus(""),2500);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 11. PÁGINAS SEO /voz/* — SPA con History API
// ═══════════════════════════════════════════════════════════════════════════════
const VOZ_DATA = {
  baritono: {
    emoji:"🎭", color:"#7C4DFF", range:"Sol2 – Sol4", hz:"98 – 392 Hz",
    ytId: "E_h-T5ZKZDU", ytId2: "rmopMoKJo34",
    artists:["Frank Sinatra","Elvis Presley","Michael Bublé","David Bowie","Freddie Mercury","Alejandro Sanz","Joaquín Sabina","Serrat"],
    artistImgs:{
      "Frank Sinatra":"https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Frank_Sinatra_-_publicity.jpg/220px-Frank_Sinatra_-_publicity.jpg",
      "Elvis Presley":"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Elvis_Presley_promoting_Jailhouse_Rock.jpg/220px-Elvis_Presley_promoting_Jailhouse_Rock.jpg",
    },
    mics:[
      {name:"Shure SM7B",reason:"Estándar broadcast para voces graves y cálidas. Ideal para el rango barítono.",search:"Shure SM7B microfono"},
      {name:"Audio-Technica AT4040",reason:"Captura perfectamente el rango medio-bajo con gran detalle.",search:"Audio Technica AT4040"},
      {name:"Rode NT2-A",reason:"Gran versatilidad para voces profundas con tres patrones polares.",search:"Rode NT2-A microfono"},
    ],
    pro_mics:["Neumann U87","AKG C414 XLII"],
    home_studio:{
      fun:   [{name:"Fifine K669B USB",search:"Fifine K669B"},{name:"Auriculares OneOdio Pro-10",search:"OneOdio Pro-10"}],
      basic: [{name:"Shure MV7 USB/XLR",search:"Shure MV7"},{name:"Filtro anti-pop doble",search:"filtro antipop microfono"},{name:"Brazo articulado",search:"brazo articulado microfono"}],
      medium:[{name:"Focusrite Scarlett 2i2",search:"Focusrite Scarlett 2i2"},{name:"Shure SM7B",search:"Shure SM7B"},{name:"Sony MDR-7506",search:"Sony MDR 7506"}],
      pro:   [{name:"Universal Audio Apollo Twin",search:"UA Apollo Twin"},{name:"Neumann U87",search:"Neumann U87"},{name:"Yamaha HS8",search:"Yamaha HS8 monitores"}],
    },
    songs:["My Way – Frank Sinatra","Perfect – Ed Sheeran","Hallelujah – Leonard Cohen","Corazón Partío – Alejandro Sanz","Hotel California – Eagles","Bohemian Rhapsody – Queen","Let It Be – Beatles","Creep – Radiohead"],
    exercises_es:[
      "Escalas de Do mayor subiendo por semitonos — canta lento, sin forzar",
      "Arpegios Sol2–Sol4–Sol2 en 'ah' con boca abierta",
      "Vocalizaciones ma-me-mi-mo-mu en escala ascendente y descendente",
      "Sirenas completas del grave al agudo en 'oooo' suave",
      "Humming con labios cerrados — siente la resonancia en la cabeza",
      "Lip trill (vibración de labios) subiendo y bajando la escala",
      "Ejercicio de passaggio: trabaja el Si2-Re3 suavemente sin romper",
      "Calentamiento de 5 minutos: bostezos + rotación de cuello + humming",
    ],
    exercises_en:[
      "C major scales ascending by semitones — slow, no forcing",
      "Arpeggios G2–G4–G2 on 'ah' with open mouth",
      "Vocalizations ma-me-mi-mo-mu on ascending/descending scale",
      "Full sirens low to high on soft 'oooo'",
      "Lip-closed humming — feel the resonance in your head",
      "Lip trill up and down the scale",
      "Passaggio exercise: work the B2-D3 gently without breaking",
      "5-minute warm-up: yawns + neck rotation + humming",
    ],
    desc_es:"El barítono es el tipo de voz masculina más común y versátil del mundo. Su zona de confort abarca desde el Sol2 al Sol4, con un timbre cálido, oscuro y proyectado que lo hace ideal para el pop, el rock, el jazz y la música clásica. Se estima que el 60-70% de los cantantes masculinos son barítonos, aunque muchos no lo saben porque no han hecho ningún análisis vocal. Entre los barítonos más famosos de la historia se encuentran Frank Sinatra, Elvis Presley, David Bowie, Freddie Mercury (sí, era barítono con extensión de tenor), Alejandro Sanz y Michael Bublé. La riqueza armónica del barítono permite tanto el drama de la ópera como la intimidad del jazz o la potencia del rock. Si eres barítono, tu zona de mayor poder está entre el La2 y el Mi4. Con técnica y entrenamiento vocal, puedes extender tu registro hacia el Sol4 y más arriba usando mix voice. El secreto del barítono moderno no es llegar al agudo a la fuerza, sino construir una voz completa desde los graves.",
    desc_en:"The baritone is the most common and versatile male voice type in the world. Its comfort zone spans from G2 to G4, with a warm, dark, projected timbre ideal for pop, rock, jazz and classical music. An estimated 60-70% of male singers are baritones, though many don't know it because they've never done a vocal analysis.  Famous baritones include Frank Sinatra, Elvis Presley, David Bowie, Freddie Mercury (yes, he was a baritone with tenor extension), Alejandro Sanz and Michael Bublé. The harmonic richness of the baritone allows both operatic drama and jazz intimacy.  If you're a baritone, your power zone is between A2 and E4. With vocal technique and training, you can extend your range to G4 and beyond using mix voice.",
  },

  tenor: {
    emoji:"🎤", color:"#118AB2", range:"Do3 – Do5", hz:"131 – 523 Hz",
    ytId: "9fTGr5e5Ksk", ytId2: "KVLtTX3d0Kk",
    artists:["Luciano Pavarotti","Andrea Bocelli","Benson Boone","Camilo Sesto","Alejandro Fernández","Roberto Carlos","Il Volo","Plácido Domingo"],
    artistImgs:{
      "Pavarotti":"https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Luciano_Pavarotti_with_Tommy_Tune_%28cropped%29.jpg/220px-Luciano_Pavarotti_with_Tommy_Tune_%28cropped%29.jpg",
    },
    mics:[
      {name:"Audio-Technica AT2035",reason:"Realce en la 'banda de aire' (10-12kHz) captura los armónicos agudos del tenor.",search:"Audio Technica AT2035"},
      {name:"Rode NT1-A",reason:"Ultrabajo ruido de fondo para los pianissimos del tenor lírico.",search:"Rode NT1-A microfono"},
      {name:"AKG C214",reason:"Calidad profesional, captura el carácter musical del tenor con precisión.",search:"AKG C214 microfono"},
    ],
    pro_mics:["Neumann TLM 103","Telefunken ELAM 251"],
    home_studio:{
      fun:   [{name:"Fifine K669B USB",search:"Fifine K669B"},{name:"Auriculares AKG K52",search:"AKG K52"}],
      basic: [{name:"Rode NT-USB",search:"Rode NT USB"},{name:"Filtro anti-pop metálico",search:"filtro antipop metalico"},{name:"Soporte de mesa",search:"soporte microfono mesa"}],
      medium:[{name:"Focusrite Scarlett Solo",search:"Focusrite Scarlett Solo"},{name:"AT2035",search:"Audio Technica AT2035"},{name:"Audio-Technica M40x",search:"Audio Technica ATH M40x"}],
      pro:   [{name:"Apollo Solo",search:"Universal Audio Apollo Solo"},{name:"Neumann TLM 103",search:"Neumann TLM 103"},{name:"Yamaha HS5",search:"Yamaha HS5 monitores"}],
    },
    songs:["Nessun Dorma – Pavarotti","Con Te Partirò – Bocelli","Beautiful Things – Benson Boone","Libre – Nino Bravo","Tu Cárcel – Los Yonics","Bésame Mucho – Trio Los Panchos","O Sole Mio – Traditional","Ave María – Schubert"],
    exercises_es:[
      "Sirenas ascendentes hasta Do5 en 'ee' — mantén la posición alta de laringe",
      "Escalas en mezzo voce (media voz) — nunca a plena potencia en el calentamiento",
      "Ejercicios de mix voice: alterna chest voice y head voice en zona Si3-Re4",
      "Trinos en La3-Do4 con lengua y labios relajados",
      "Vocalizaciones en 'i' cerrada — levanta el velo del paladar",
      "Escala cromática del Do3 al Do5 lentamente, buscando homogeneidad",
      "Messa di voce en Sol3: empieza piano, crece al máximo, vuelve a piano",
      "Ejercicio de apoyo: canta una escala de 5 notas empujando ligeramente el diafragma",
    ],
    exercises_en:[
      "Ascending sirens to C5 on 'ee' — keep high larynx position",
      "Mezzo voce scales — never full power during warm-up",
      "Mix voice exercises: alternate chest and head voice in B3-D4 zone",
      "Trills on A3-C4 with relaxed tongue and lips",
      "Closed 'i' vocalizations — raise the soft palate",
      "Chromatic scale from C3 to C5 slowly, looking for homogeneity",
      "Messa di voce on G3: start piano, grow to maximum, return to piano",
      "Support exercise: sing a 5-note scale gently pushing the diaphragm",
    ],
    desc_es:"El tenor es la voz masculina más aguda de las categorías principales, y también la más demandada en el pop, el rock y la ópera. Su rango abarca desde el Do3 al Do5, aunque los tenores líricos pueden superar el Do5 con técnica avanzada. El Do5 (Do de pecho) es considerado el 'Santo Grial' de la voz masculina — el momento en que un tenor demuestra su dominio técnico.  Los tenores más icónicos de la historia incluyen a Luciano Pavarotti, Plácido Domingo, Andrea Bocelli, y en el pop moderno artistas como Benson Boone, Bruno Mars o Camilo. La voz de tenor tiene una brillantez y proyección natural que llena cualquier espacio sin amplificación.  Si eres tenor, tu desafío principal es el passaggio (zona de transición de pecho a cabeza), que en tu caso ocurre aproximadamente entre el Mi4 y el Sol4. Aprender a navegar esa zona con mix voice es la clave para un tenor completo y versátil.",
    desc_en:"The tenor is the highest of the main male voice categories, and also the most in-demand in pop, rock and opera. Its range spans from C3 to C5, though lyric tenors can surpass C5 with advanced technique. High C (chest C5) is considered the 'Holy Grail' of male singing.  Iconic tenors include Luciano Pavarotti, Plácido Domingo, Andrea Bocelli, and in modern pop Benson Boone, Bruno Mars and Camilo. The tenor voice has a natural brightness and projection that fills any space without amplification.",
  },

  soprano: {
    emoji:"✨", color:"#FF4FA3", range:"Do4 – Do6", hz:"261 – 1047 Hz",
    ytId: "5hR8-YSfFvI", ytId2: "bAsXMCiB5nQ",
    artists:["Mariah Carey","Whitney Houston","Celine Dion","Ariana Grande","Sabrina Carpenter","María Callas","Montserrat Caballé","Isabel Pantoja"],
    artistImgs:{
      "Mariah Carey":"https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Mariah_Carey_2019_by_Glenn_Francis.jpg/220px-Mariah_Carey_2019_by_Glenn_Francis.jpg",
      "Whitney Houston":"https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Whitney_Houston_Welcome_Home_Heroes_1.jpg/220px-Whitney_Houston_Welcome_Home_Heroes_1.jpg",
      "Celine Dion":"https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Celine_dion_2017.jpg/220px-Celine_dion_2017.jpg",
      "Ariana Grande":"https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Ariana_Grande_in_2019.jpg/220px-Ariana_Grande_in_2019.jpg",
    },
    mics:[
      {name:"Neumann TLM 102",reason:"La referencia profesional para voces de soprano. Captura los agudos con fidelidad total.",search:"Neumann TLM 102"},
      {name:"Audio-Technica AT2020",reason:"Captura armónicos brillantes sin saturación en los agudos extremos.",search:"Audio Technica AT2020 USB"},
      {name:"Rode NT1",reason:"Ruido de fondo casi nulo, ideal para los pianissimos de soprano.",search:"Rode NT1 microfono"},
    ],
    pro_mics:["Neumann U87","Sennheiser MKH 40"],
    home_studio:{
      fun:   [{name:"Fifine K669B USB",search:"Fifine K669B"},{name:"Auriculares Superlux HD681",search:"Superlux HD681"}],
      basic: [{name:"Rode NT-USB",search:"Rode NT USB"},{name:"Pop filter doble",search:"filtro antipop doble"},{name:"Soporte de mesa articulado",search:"soporte microfono articulado"}],
      medium:[{name:"Focusrite Scarlett Solo",search:"Focusrite Scarlett Solo"},{name:"AKG C214",search:"AKG C214"},{name:"Audio-Technica M50x",search:"Audio Technica ATH M50x"}],
      pro:   [{name:"Apollo Solo",search:"Universal Audio Apollo Solo"},{name:"Neumann TLM 103",search:"Neumann TLM 103"},{name:"Yamaha HS5",search:"Yamaha HS5"}],
    },
    songs:["Hero – Mariah Carey","I Will Always Love You – Whitney Houston","My Heart Will Go On – Celine Dion","God is a Woman – Ariana Grande","Casta Diva – Bellini","Ave María – Schubert","O Mio Babbino Caro – Puccini","Concierto de Aranjuez – Versión vocal"],
    exercises_es:[
      "Trinos en Re5-La5 con vocales abiertas — relaja la mandíbula completamente",
      "Escalas de octava completas Do4-Do5-Do4 en 'ah' y 'oh'",
      "Pianissimo en los agudos: Do5-Mi5 en la dinámica más suave posible",
      "Portamentos suaves descendentes desde La5 — evita saltos bruscos",
      "Vocalizaciones en 'ah' con resonancia de cabeza — imagen mental: canta 'hacia arriba'",
      "Ejercicio de legato: escala de Do mayor atada sin ataques de glotis",
      "Staccato en Re5: notas picadas sin tensión de garganta",
      "Calentamiento con lip trill suave — no fuerce los agudos en frío",
    ],
    exercises_en:[
      "Trills D5-A5 with open vowels — completely relax the jaw",
      "Full octave scales C4-C5-C4 on 'ah' and 'oh'",
      "Pianissimo on high notes: C5-E5 at softest possible dynamic",
      "Gentle descending portamentos from A5 — avoid abrupt jumps",
      "Head resonance vocalizations on 'ah' — mental image: sing 'upward'",
      "Legato exercise: C major scale tied without glottal attacks",
      "Staccato on D5: detached notes without throat tension",
      "Warm-up with gentle lip trill — never force high notes cold",
    ],
    desc_es:"La soprano es la voz femenina más aguda y la que históricamente ha dominado la ópera y el pop de alta gama. Su extensión natural va del Do4 al La5, con las sopranos de coloratura alcanzando el Do6 y más allá. Es la voz más luminosa, brillante y dramática del espectro vocal humano.  Mariah Carey es probablemente la soprano pop más famosa del mundo, conocida por su whistle register (registro de silbido) que alcanza el Sol7. Whitney Houston, Celine Dion y Ariana Grande también son sopranos reconocidas. En la ópera clásica, María Callas y Montserrat Caballé son referentes absolutos.  Si eres soprano, tu tesoro es el registro agudo y tu reto principal es mantener la calidad tímbrica en toda la extensión. El passaggio femenino ocurre aproximadamente en Mi4-Sol4 (según el subtipo de soprano) y requiere un trabajo especial de mix voice para que la transición sea imperceptible.",
    desc_en:"The soprano is the highest female voice type and historically the one that has dominated opera and high-end pop. Its natural range spans from C4 to A5, with coloratura sopranos reaching C6 and beyond. It is the most luminous, brilliant and dramatic voice in the human vocal spectrum.  Mariah Carey is probably the world's most famous pop soprano, known for her whistle register reaching G7. Whitney Houston, Celine Dion and Ariana Grande are also recognized sopranos. In classical opera, Maria Callas and Montserrat Caballé are absolute references.",
  },

  "mezzo-soprano": {
    emoji:"🎶", color:"#FF9F1C", range:"La3 – La5", hz:"220 – 880 Hz",
    ytId: "bAsXMCiB5nQ",
    artists:["Adele","Amy Winehouse","Beyoncé","Rosalía","Tracy Chapman","Billie Eilish","Lana Del Rey","Norah Jones"],
    artistImgs:{
      "Adele":"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Adele_2016.jpg/220px-Adele_2016.jpg",
      "Amy Winehouse":"https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Amy_Winehouse_2007.jpg/220px-Amy_Winehouse_2007.jpg",
      "Beyoncé":"https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Beyoncé_in_Cannes_%282012%29.jpg/220px-Beyoncé_in_Cannes_%282012%29.jpg",
    },
    mics:[
      {name:"Rode NT1",reason:"Captura la calidez del registro medio con precisión y bajo ruido.",search:"Rode NT1 microfono"},
      {name:"Audio-Technica AT2035",reason:"Equilibrio perfecto para voces de potencia media-alta.",search:"Audio Technica AT2035"},
      {name:"Shure SM27",reason:"Versátil y natural, ideal para el rango completo del mezzo.",search:"Shure SM27 microfono"},
    ],
    pro_mics:["Neumann U87","AKG C414 XLII"],
    home_studio:{
      fun:   [{name:"Fifine K669B USB",search:"Fifine K669B"},{name:"Auriculares AKG K92",search:"AKG K92"}],
      basic: [{name:"Rode NT-USB",search:"Rode NT USB"},{name:"Filtro anti-pop",search:"filtro antipop microfono"},{name:"Brazo articulado básico",search:"brazo microfono mesa"}],
      medium:[{name:"Focusrite Scarlett 2i2",search:"Focusrite Scarlett 2i2"},{name:"AT2020",search:"Audio Technica AT2020"},{name:"Sony MDR-7506",search:"Sony MDR 7506"}],
      pro:   [{name:"Apollo Twin",search:"UA Apollo Twin"},{name:"AKG C414",search:"AKG C414"},{name:"Yamaha HS5",search:"Yamaha HS5"}],
    },
    songs:["Rolling in the Deep – Adele","Rehab – Amy Winehouse","Crazy in Love – Beyoncé","Con Altura – Rosalía","Fast Car – Tracy Chapman","Bad Guy – Billie Eilish","Summertime Sadness – Lana Del Rey","Come Away With Me – Norah Jones"],
    exercises_es:[
      "Escalas La3-La5 subiendo y bajando en 'ah' — trabaja tanto el pecho como la cabeza",
      "Arpegios de tríada La3-Do4-Mi4-La4 en todas las vocales",
      "Vocalizaciones en 'nay-nay' — posición nasal que ayuda a la resonancia media",
      "Ejercicios de pecho hacia abajo: Fa3-Re3 con pleno apoyo diafragmático",
      "Sirenas Do3-Do5 en 'oooo' — sin breaks, transición suave en el passaggio",
      "Staccato en Re4: notas picadas con boca semifría",
      "Ejercicio de 'ng': escala cromática en posición nasal abierta",
      "Mix voice Do4-Sol4: alterna entre pecho y mezcla sin tensión",
    ],
    exercises_en:[
      "Scales A3-A5 up and down on 'ah' — work both chest and head register",
      "Triad arpeggios A3-C4-E4-A4 on all vowels",
      "Vocalizations on 'nay-nay' — nasal position that helps middle resonance",
      "Downward chest exercises: F3-D3 with full diaphragm support",
      "Sirens C3-C5 on 'oooo' — no breaks, smooth passaggio transition",
      "Staccato on D4: detached notes with semi-open mouth",
      "'Ng' exercise: chromatic scale in open nasal position",
      "Mix voice C4-G4: alternate chest and mix without tension",
    ],
    desc_es:"La mezzosoprano es la voz femenina media, poderosa y rica en armónicos. Su timbre cálido, carnoso y expresivo la convierte en la voz más completa y versátil del espectro femenino. El rango natural va del La3 al La5, aunque con técnica puede extenderse en ambas direcciones.  Algunas de las artistas más influyentes de los últimos 30 años son mezzosopranos: Adele, Beyoncé, Amy Winehouse, Rosalía, Billie Eilish y Lana Del Rey. Esta voz domina el soul, el R&B, el pop de autor y el flamenco por su capacidad de expresar emociones complejas con matices únicos.  Si eres mezzosoprano, tu mayor fortaleza es la zona Do4-La4, donde tu voz suena más plena y proyectada. Con entrenamiento puedes desarrollar un poderoso registro de pecho hacia abajo (Fa3-Do3) y un head voice brillante hasta el Do5.",
    desc_en:"The mezzo-soprano is the middle female voice type, powerful and rich in harmonics. Its warm, full and expressive timbre makes it the most complete and versatile voice in the female spectrum. The natural range is A3 to A5, though with technique it can extend in both directions.  Some of the most influential artists of the last 30 years are mezzo-sopranos: Adele, Beyoncé, Amy Winehouse, Rosalía, Billie Eilish and Lana Del Rey.",
  },

  contralto: {
    emoji:"🌿", color:"#80B918", range:"Fa3 – Fa5", hz:"175 – 698 Hz",
    ytId: "N_RhvtKpSQE",
    artists:["Tracy Chapman","Norah Jones","Cher","Nina Simone","k.d. lang","Tina Turner","Macy Gray","Alanis Morissette"],
    artistImgs:{},
    mics:[
      {name:"Shure SM7B",reason:"Diseñado para voces graves, el SM7B captura la profundidad única de la contralto.",search:"Shure SM7B"},
      {name:"Rode Procaster",reason:"Dinámico con gran cuerpo y calidez para voces graves femeninas.",search:"Rode Procaster microfono"},
      {name:"Audio-Technica AT4040",reason:"Condensador cálido que favorece el registro grave con detalle.",search:"Audio Technica AT4040"},
    ],
    pro_mics:["Neumann U87","Telefunken U47"],
    home_studio:{
      fun:   [{name:"Fifine K669B USB",search:"Fifine K669B"},{name:"Auriculares Superlux HD668B",search:"Superlux HD668B"}],
      basic: [{name:"Shure MV7",search:"Shure MV7"},{name:"Pop filter",search:"filtro antipop"},{name:"Soporte articulado",search:"brazo microfono"}],
      medium:[{name:"Focusrite Scarlett 2i2",search:"Focusrite Scarlett 2i2"},{name:"AT4040",search:"Audio Technica AT4040"},{name:"Beyerdynamic DT 770 Pro",search:"Beyerdynamic DT 770 Pro"}],
      pro:   [{name:"Apollo Twin",search:"UA Apollo Twin"},{name:"Neumann U87",search:"Neumann U87"},{name:"Yamaha HS8",search:"Yamaha HS8"}],
    },
    songs:["Fast Car – Tracy Chapman","Come Away With Me – Norah Jones","Believe – Cher","Feeling Good – Nina Simone","Constant Craving – k.d. lang","River Deep Mountain High – Tina Turner","I Try – Macy Gray","You Oughta Know – Alanis Morissette"],
    exercises_es:[
      "Humming en Fa3-Do4 — siente la resonancia en el pecho, no en la garganta",
      "Ejercicios de registro de pecho profundo: Do3-Fa3 con apoyo total",
      "Sirenas Do3-Do5 suaves — la contralto tiene graves únicos, no los fuerces",
      "Vocalizaciones en 'oo' grave con mandíbula completamente relajada",
      "Escalas descendentes con apoyo diafragmático máximo — Do4 a Do3",
      "Ejercicio de 'oh' oscuro en Fa3: imagina cantar desde el pecho",
      "Extensión de agudos en head voice suave: Do5-Fa5 sin tensión",
      "Calentamiento de 10 minutos obligatorio antes de cualquier sesión",
    ],
    exercises_en:[
      "Humming on F3-C4 — feel the resonance in your chest, not throat",
      "Deep chest register exercises: C3-F3 with full support",
      "Gentle sirens C3-C5 — your low notes are unique, don't force them",
      "Low 'oo' vocalizations with completely relaxed jaw",
      "Descending scales with maximum diaphragm support — C4 to C3",
      "Dark 'oh' exercise on F3: imagine singing from the chest",
      "Soft head voice extension: C5-F5 without tension",
      "Mandatory 10-minute warm-up before any session",
    ],
    desc_es:"La contralto es la voz femenina más grave y oscura, y una de las más raras en el mundo. Su tessitura natural va del Fa3 al Fa5, con un timbre profundo, oscuro y aterciopelado que resulta hipnótico. Es una voz poco común — solo el 5-10% de las mujeres son contraltos verdaderas.  Artistas como Tracy Chapman, Nina Simone, Cher, Norah Jones y k.d. lang son ejemplos icónicos de contralto en la música popular. En la ópera clásica, la contralto es la más escasa y codiciada de las voces femeninas.  Si eres contralto, tu mayor tesoro son tus graves únicos — esa zona Do3-Sol3 que ninguna otra voz femenina puede alcanzar con tal potencia y oscuridad. No intentes cantar como soprano: abraza y desarrolla tu registro grave, que es tu identidad vocal más poderosa.",
    desc_en:"The contralto is the lowest and darkest female voice type, and one of the rarest in the world. Its natural range spans from F3 to F5, with a deep, dark, velvety timbre that is hypnotic. Only 5-10% of women are true contraltos.  Artists like Tracy Chapman, Nina Simone, Cher, Norah Jones and k.d. lang are iconic contralto examples in popular music.",
  },

  bajo: {
    emoji:"🎸", color:"#1E3A5F", range:"Mi2 – Do4", hz:"82 – 261 Hz",
    ytId: "YkSmHCyUKdQ",
    artists:["Johnny Cash","Barry White","Leonard Cohen","Tom Waits","Nick Cave","Isaac Hayes","Lou Rawls","Boris Christoff"],
    artistImgs:{},
    mics:[
      {name:"Shure SM7B",reason:"El estándar absoluto para voces graves broadcast. Desarrollado para voces profundas.",search:"Shure SM7B"},
      {name:"Electro-Voice RE20",reason:"Cardiode de patrón variable, el preferido por locutores y cantantes de bajo.",search:"Electro Voice RE20"},
      {name:"Rode Broadcaster",reason:"Cálido y robusto, captura la profundidad del bajo sin distorsión.",search:"Rode Broadcaster microfono"},
    ],
    pro_mics:["Neumann U87","AKG C414 XLII"],
    home_studio:{
      fun:   [{name:"Fifine K669B USB",search:"Fifine K669B"},{name:"Auriculares Beyerdynamic DT 770",search:"Beyerdynamic DT 770 32ohm"}],
      basic: [{name:"Shure MV7",search:"Shure MV7"},{name:"Filtro anti-pop doble",search:"filtro antipop doble"},{name:"Brazo articulado",search:"brazo microfono"}],
      medium:[{name:"Focusrite Scarlett 2i2",search:"Focusrite Scarlett 2i2"},{name:"SM7B",search:"Shure SM7B"},{name:"Beyerdynamic DT 770 Pro",search:"Beyerdynamic DT 770 Pro"}],
      pro:   [{name:"Apollo Twin",search:"UA Apollo Twin"},{name:"Neumann U87",search:"Neumann U87"},{name:"Yamaha HS8",search:"Yamaha HS8"}],
    },
    songs:["Ring of Fire – Johnny Cash","Can't Get Enough – Barry White","Hallelujah – Leonard Cohen","Georgia Lee – Tom Waits","Into My Arms – Nick Cave","Shaft – Isaac Hayes","You'll Never Walk Alone – Lou Rawls","Ol' Man River – Traditional"],
    exercises_es:[
      "Humming en Mi2-Do3 — el bajo más profundo requiere más calentamiento que cualquier otra voz",
      "Sirenas descendentes al máximo grave — Mi2-Si1 si tu voz lo permite",
      "Vocalizaciones en 'oo' y 'oh' en el registro más bajo posible",
      "Escalas muy lentas con apoyo total: Mi2 subiendo a Do4 sin forzar",
      "Buzzing de labios (lip buzz) en el registro más bajo — 5 minutos",
      "Ejercicio de 'ng' en Fa2-Do3: mantén la resonancia sin tensión",
      "Calentamiento de 15 minutos mínimo — las cuerdas graves necesitan más tiempo",
      "Hidratación: bebe agua tibia antes de cantar, nunca fría",
    ],
    exercises_en:[
      "Humming on E2-C3 — the deepest bass requires more warm-up than any other voice",
      "Maximum low descending sirens — E2-B1 if your voice allows",
      "Low 'oo' and 'oh' vocalizations at lowest possible register",
      "Very slow scales with full support: E2 ascending to C4 without forcing",
      "Lip buzz at lowest register — 5 minutes",
      "'Ng' exercise on F2-C3: maintain resonance without tension",
      "Minimum 15-minute warm-up — low vocal cords need more time",
      "Hydration: drink warm water before singing, never cold",
    ],
    desc_es:"El bajo es la voz masculina más grave, profunda y resonante. Una rareza vocal auténtica — solo el 5% de los cantantes masculinos tienen un bajo verdadero — con una presencia escénica e imponente que ninguna otra voz puede igualar. El rango natural va del Mi2 al Do4, con algunos bajos profundos (bajo profundo u octavista) llegando al Mi1 o más abajo.  Johnny Cash, Barry White, Leonard Cohen, Tom Waits y Isaac Hayes son los referentes del bajo en la música popular. Su timbre oscuro, autoritario y magnético ha definido géneros enteros, desde el gospel y el soul hasta el country y el rock alternativo.  Si eres bajo, tu mayor activo es esa zona Mi2-Sol3 que solo tú puedes habitar con plena potencia. No intentes competir con tenores o barítonos en los agudos — tu poder está en los graves, y ese poder es único.",
    desc_en:"The bass is the lowest, deepest and most resonant male voice type. A true vocal rarity — only 5% of male singers have a genuine bass voice — with an imposing stage presence that no other voice can match. The natural range spans from E2 to C4, with some deep basses reaching E1 or lower.  Johnny Cash, Barry White, Leonard Cohen, Tom Waits and Isaac Hayes are the bass references in popular music.",
  },
};

function renderVozPage(slug) {
  const keyMap = {
    "baritono":"baritono","tenor":"tenor","soprano":"soprano",
    "mezzo-soprano":"mezzo-soprano","contralto":"contralto","bajo":"bajo"
  };
  const key  = keyMap[slug];
  const data = VOZ_DATA[key];
  if (!data) return false;

  const langES   = ["es","ca","pt","it","fr","de","ru","uk"].includes(lang);
  const desc     = langES ? data.desc_es : data.desc_en;
  const exercises= langES ? data.exercises_es : data.exercises_en;
  const amzDomain= getAmazonDomain();
  const currency = getCurrencySymbol();
  const capSlug  = slug.charAt(0).toUpperCase() + slug.slice(1);

  // Fotos de artistas — usar artistImgs del VOZ_DATA + MONO_IMGS + iniciales
  const artistCards = data.artists.map(a => {
    const img = data.artistImgs?.[a] || MONO_IMGS[a] || imgCache[a];
    const initImg = getInitialsAvatar(a);
    return `<div style="text-align:center;padding:.75rem;background:rgba(255,255,255,.04);
      border-radius:12px;border:1px solid rgba(255,255,255,.08);transition:transform .2s"
      onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform=''">
      <div style="width:64px;height:64px;border-radius:50%;margin:0 auto .5rem;overflow:hidden;
        background:rgba(124,77,255,.2);display:flex;align-items:center;justify-content:center;">
        <img src="${img||initImg}" alt="${a}" style="width:100%;height:100%;object-fit:cover"
          onerror="this.src='${initImg}'">
      </div>
      <div style="font-weight:700;font-size:.82rem;margin-bottom:.15rem">${a}</div>
      <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(a+' vocal')}"
        target="_blank" style="font-size:.68rem;color:${data.color};text-decoration:none">▶ Ver</a>
    </div>`;
  }).join("");

  // Micros con botón Amazon
  const micCards = data.mics.map((m,i) => `
    <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
      border-radius:14px;padding:1.1rem;display:flex;gap:.75rem;align-items:flex-start;
      ${i===0?'border-color:'+data.color+'55;background:'+data.color+'08;':''}">
      <div style="font-size:1.5rem">🎙️</div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:.95rem;margin-bottom:.2rem">${m.name}
          ${i===0?'<span style="background:'+data.color+'22;color:'+data.color+';font-size:.65rem;font-weight:700;padding:.1rem .45rem;border-radius:20px;margin-left:.4rem">★ Recomendado</span>':''}
        </div>
        <div style="font-size:.8rem;color:#9CA3AF;margin-bottom:.55rem;line-height:1.5">${m.reason}</div>
        <a href="https://www.${amzDomain}/s?k=${encodeURIComponent(m.search)}&tag=${AFFILIATE_ID}"
          target="_blank" rel="noopener sponsored"
          style="display:inline-block;background:linear-gradient(135deg,#FF9F1C,#FF4FA3);color:#fff;
          font-size:.78rem;font-weight:700;padding:.35rem .8rem;border-radius:8px;text-decoration:none">
          Ver precio en Amazon ${currency} →
        </a>
      </div>
    </div>`).join("");

  // Pro mics (referencia sin afiliado)
  const proMicHtml = data.pro_mics.map(p=>`
    <span style="background:rgba(255,215,0,.1);color:#FFD700;border:1px solid rgba(255,215,0,.2);
      font-size:.78rem;font-weight:700;padding:.25rem .65rem;border-radius:20px">⭐ ${p}</span>
  `).join("");

  // Home Studio — 4 packs completos
  const packLabels = {
    fun:   {label:"🟢 Básico",sub:"Para karaoke en casa · 50-120"+currency,gradient:"#7C4DFF,#FF4FA3"},
    basic: {label:"🟡 Económico",sub:"Quiero sonar bien · 120-250"+currency,gradient:"#FF9F1C,#FF4FA3"},
    medium:{label:"🟠 Medio",sub:"Grabaciones serias · 250-600"+currency,gradient:"#06D6A0,#118AB2"},
    pro:   {label:"🔴 Pro",sub:"Sonido comercial · 600-1500"+currency,gradient:"#E63946,#7C4DFF"},
  };
  const studioHTML = Object.entries(data.home_studio).map(([tier, items]) => {
    const {label,sub,gradient} = packLabels[tier];
    return `<div style="background:rgba(255,255,255,.04);border-radius:16px;padding:1.25rem;
      border:1px solid rgba(255,255,255,.08)">
      <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.3rem">
        <span style="background:linear-gradient(135deg,${gradient});-webkit-background-clip:text;
          -webkit-text-fill-color:transparent;font-weight:800;font-size:.95rem">${label}</span>
      </div>
      <div style="font-size:.75rem;color:#6B7280;margin-bottom:.75rem">${sub}</div>
      ${items.map(item=>`
        <div style="display:flex;align-items:center;justify-content:space-between;
          padding:.45rem 0;border-bottom:1px solid rgba(255,255,255,.05)">
          <span style="font-size:.82rem;color:#D1D5DB">🎛️ ${item.name}</span>
          <a href="https://www.${amzDomain}/s?k=${encodeURIComponent(item.search)}&tag=${AFFILIATE_ID}"
            target="_blank" rel="noopener sponsored"
            style="font-size:.72rem;font-weight:700;color:${data.color};text-decoration:none;
            background:${data.color}15;padding:.2rem .55rem;border-radius:8px;white-space:nowrap">
            Ver oferta →
          </a>
        </div>`).join("")}
    </div>`;
  }).join("");

  // Canciones con karaoke
  const songsHTML = data.songs.map(s => {
    const yt = `https://www.youtube.com/results?search_query=${encodeURIComponent(s+' karaoke')}`;
    const sp = `https://open.spotify.com/search/${encodeURIComponent(s)}`;
    return `<div style="background:rgba(255,255,255,.04);border-radius:10px;padding:.7rem 1rem;
      display:flex;align-items:center;gap:.5rem;border:1px solid rgba(255,255,255,.06)">
      <span style="color:${data.color}">🎵</span>
      <span style="font-weight:600;font-size:.9rem;flex:1">${s}</span>
      <a href="${yt}" target="_blank" rel="noopener"
        style="background:rgba(255,0,0,.12);color:#ff4444;font-size:.7rem;font-weight:700;
        padding:.2rem .55rem;border-radius:20px;text-decoration:none;border:1px solid rgba(255,0,0,.2)">
        ▶ Karaoke
      </a>
      <a href="${sp}" target="_blank" rel="noopener"
        style="background:rgba(29,185,84,.12);color:#1DB954;font-size:.7rem;font-weight:700;
        padding:.2rem .55rem;border-radius:20px;text-decoration:none;border:1px solid rgba(29,185,84,.2)">
        Spotify
      </a>
    </div>`;
  }).join("");

  // Ejercicios
  const exHTML = exercises.map((e,i)=>`
    <div style="background:rgba(255,255,255,.04);border-left:3px solid ${data.color};
      padding:.65rem .9rem;border-radius:0 10px 10px 0;font-size:.88rem;color:#E5E7EB;
      border-bottom:1px solid rgba(255,255,255,.04)">
      <span style="color:${data.color};font-weight:800;margin-right:.5rem">${i+1}.</span>${e}
    </div>`).join("");

  const descClean = desc.replace(/\n/g,' ');
  document.body.innerHTML = `
<!DOCTYPE html><html lang="${lang}"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Voz de ${capSlug} ${data.emoji} — Artistas, ejercicios, micrófonos y canciones | Harmiq</title>
<meta name="description" content="${descClean.slice(0,158)}">
<meta property="og:title" content="Voz de ${capSlug} — Descubre si tu voz es ${slug}">
<meta property="og:description" content="${descClean.slice(0,120)}">
<link rel="canonical" href="https://harmiq.app/voz/${slug}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800;900&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
</head><body>

<nav>
  <a class="logo" href="/">🎙️ Harmiq</a>
  <ul class="nav-links">
    <li><a href="/voz/baritono">Barítono</a></li>
    <li><a href="/voz/tenor">Tenor</a></li>
    <li><a href="/voz/soprano">Soprano</a></li>
    <li><a href="/voz/mezzo-soprano">Mezzo</a></li>
    <li><a href="/voz/contralto">Contralto</a></li>
    <li><a href="/voz/bajo">Bajo</a></li>
  </ul>
  <a class="btn" href="/#app" style="padding:.5rem 1.2rem;font-size:.85rem">🎤 Analizar mi voz</a>
</nav>

<div style="max-width:860px;margin:0 auto;padding:1.5rem">

  <!-- HERO -->
  <div style="background:linear-gradient(135deg,${data.color}20,rgba(255,79,163,.1));
    border-radius:20px;padding:2.5rem 2rem;margin-bottom:2.5rem;text-align:center;
    border:1px solid ${data.color}33">
    <div style="font-size:3.5rem;margin-bottom:.5rem">${data.emoji}</div>
    <h1 style="font-family:'Baloo 2',sans-serif;font-weight:900;
      font-size:clamp(2rem,5vw,3.2rem);margin-bottom:.6rem;
      background:linear-gradient(135deg,#fff 40%,${data.color});
      -webkit-background-clip:text;-webkit-text-fill-color:transparent">
      Voz de ${capSlug}
    </h1>
    <div style="display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap;margin:.75rem 0 1.25rem">
      <span style="background:${data.color}33;color:${data.color};font-weight:700;font-size:.88rem;
        padding:.35rem .9rem;border-radius:20px">🎼 ${data.range}</span>
      <span style="background:rgba(255,255,255,.08);color:#9CA3AF;font-size:.88rem;
        padding:.35rem .9rem;border-radius:20px">${data.hz}</span>
    </div>
    <p style="color:#D1D5DB;font-size:.95rem;line-height:1.75;max-width:640px;margin:0 auto 1.5rem;
      white-space:pre-line">${desc}</p>
    <a class="btn" href="/#app" style="font-size:.95rem">
      🎤 Analizar mi voz — ¿soy ${slug}?
    </a>
  </div>

  <!-- ARTISTAS FAMOSOS -->
  <div style="margin-bottom:2.5rem">
    <h2 style="font-family:'Baloo 2',sans-serif;font-weight:800;font-size:1.5rem;margin-bottom:.3rem;
      background:linear-gradient(135deg,${data.color},#FF4FA3);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
      🌟 Artistas famosos con voz de ${capSlug}
    </h2>
    <p style="color:#6B7280;font-size:.85rem;margin-bottom:1.1rem">
      Estudia su técnica, escucha su timbre, imita su estilo.
    </p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:.75rem">
      ${artistCards}
    </div>
  </div>

  <!-- CANCIONES PERFECTAS -->
  <div style="margin-bottom:2.5rem">
    <h2 style="font-family:'Baloo 2',sans-serif;font-weight:800;font-size:1.5rem;margin-bottom:.3rem;
      background:linear-gradient(135deg,${data.color},#FF4FA3);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
      🎵 Canciones perfectas para voz de ${capSlug}
    </h2>
    <p style="color:#6B7280;font-size:.85rem;margin-bottom:1rem">
      Seleccionadas para tu rango vocal. Con acceso directo a karaoke y Spotify.
    </p>
    <div style="display:flex;flex-direction:column;gap:.5rem">${songsHTML}</div>
  </div>

  <!-- EJERCICIOS VOCALES -->
  <div style="margin-bottom:2.5rem">
    <h2 style="font-family:'Baloo 2',sans-serif;font-weight:800;font-size:1.5rem;margin-bottom:.3rem;
      background:linear-gradient(135deg,${data.color},#FF4FA3);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
      🎯 Ejercicios vocales para ${capSlug}
    </h2>
    <p style="color:#6B7280;font-size:.85rem;margin-bottom:1rem">
      Rutina de entrenamiento diaria adaptada a este tipo de voz.
    </p>
    <div style="display:flex;flex-direction:column;gap:.4rem">${exHTML}</div>
  </div>

  <!-- VIDEO YOUTUBE FIJO -->
  <div style="margin-bottom:2.5rem">
    <h2 style="font-family:'Baloo 2',sans-serif;font-weight:800;font-size:1.5rem;margin-bottom:.3rem;
      background:linear-gradient(135deg,${data.color},#FF4FA3);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
      🎬 Aprende de los mejores expertos en canto
    </h2>
    <p style="color:#6B7280;font-size:.85rem;margin-bottom:1rem">
      Clases de canto seleccionadas de los mejores vocal coaches del mundo.
    </p>
    <!-- Videos de vocal coaching seleccionados -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:.75rem;margin-bottom:1rem">
      ${[
        {id:"BjpEZ2f1j6E", title:"Cómo cantar mejor en 5 minutos", channel:"Brett Manning"},
        {id:"A8vZuFNLqyo", title:"Cómo cantar notas altas", channel:"Ken Tamplin"},
        {id:"QXSY_FiLBYk", title:"Calentamiento vocal completo", channel:"Cheryl Porter"},
        {id:"bqCPDEm2K8s", title:"Clase de canto para principiantes", channel:"Justin Stoney"},
        {id:"hzNEHAJRevk", title:"Mix voice y técnica vocal", channel:"Eric Arceneaux"},
        {id:"PgJYSJVfO04", title:"5 mejores ejercicios vocales", channel:"Felicia Ricci"},
      ].map(v=>`
        <div style="border-radius:14px;overflow:hidden;background:#000;
          box-shadow:0 4px 16px rgba(0,0,0,.4);cursor:pointer"
          onclick="this.innerHTML='<iframe width=100% height=160 src=https://www.youtube.com/embed/${v.id}?autoplay=1&rel=0 frameborder=0 allow=autoplay;encrypted-media allowfullscreen></iframe>'">
          <div style="position:relative;aspect-ratio:16/9">
            <img src="https://img.youtube.com/vi/${v.id}/mqdefault.jpg"
              alt="${v.title}" style="width:100%;height:100%;object-fit:cover"
              onerror="this.parentNode.style.background='#1a1a2e'">
            <div style="position:absolute;inset:0;display:flex;align-items:center;
              justify-content:center;background:rgba(0,0,0,.3)">
              <div style="width:48px;height:48px;background:rgba(255,0,0,.9);border-radius:50%;
                display:flex;align-items:center;justify-content:center;font-size:20px">▶</div>
            </div>
          </div>
          <div style="padding:.6rem .8rem;background:#111">
            <div style="font-size:.8rem;font-weight:700;color:#E5E7EB;margin-bottom:.1rem">${v.title}</div>
            <div style="font-size:.68rem;color:#6B7280">${v.channel}</div>
          </div>
        </div>`).join("")}
    </div>
    <a href="https://www.youtube.com/results?search_query=clases+de+canto+tecnica+vocal+${encodeURIComponent(capSlug)}"
      target="_blank" rel="noopener"
      style="display:inline-flex;align-items:center;gap:.4rem;font-size:.8rem;color:#FF0000;
      text-decoration:none;padding:.4rem .9rem;background:rgba(255,0,0,.08);
      border-radius:8px;border:1px solid rgba(255,0,0,.2)">
      ▶ Ver más clases en YouTube →
    </a>
  </div>

  <!-- MICRÓFONOS RECOMENDADOS -->
  <div style="margin-bottom:2.5rem">
    <h2 style="font-family:'Baloo 2',sans-serif;font-weight:800;font-size:1.5rem;margin-bottom:.3rem;
      background:linear-gradient(135deg,${data.color},#FF4FA3);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
      🎙️ Mejores micrófonos para voz de ${capSlug}
    </h2>
    <p style="color:#6B7280;font-size:.85rem;margin-bottom:1rem">
      Seleccionados por frecuencia de respuesta óptima para este tipo de voz. Links de Amazon.
    </p>
    <div style="display:flex;flex-direction:column;gap:.75rem;margin-bottom:1rem">
      ${micCards}
    </div>
    <div style="padding:.8rem;background:rgba(255,215,0,.05);border-radius:12px;
      border:1px solid rgba(255,215,0,.15)">
      <span style="font-size:.75rem;color:#9CA3AF">⭐ Nivel profesional (referencia): </span>
      ${proMicHtml}
    </div>
  </div>

  <!-- HOME STUDIO COMPLETO -->
  <div style="margin-bottom:2.5rem">
    <h2 style="font-family:'Baloo 2',sans-serif;font-weight:800;font-size:1.5rem;margin-bottom:.3rem;
      background:linear-gradient(135deg,${data.color},#FF4FA3);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
      🎛️ Monta tu Home Studio para voz de ${capSlug}
    </h2>
    <p style="color:#6B7280;font-size:.85rem;margin-bottom:1rem">
      4 niveles según tu presupuesto. Todos los links llevan a Amazon con el mejor precio actual.
    </p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem">
      ${studioHTML}
    </div>
    <p style="font-size:.72rem;color:#4B5563;margin-top:.75rem;text-align:center">
      * Links de afiliado Amazon · Harmiq recibe una pequeña comisión sin coste para ti
    </p>
  </div>

  <!-- SECCIÓN KARAOKE Y EVENTOS -->
  <div style="margin-bottom:2.5rem" id="_karaoke_voz_wrap">
    <h2 style="font-family:'Baloo 2',sans-serif;font-weight:800;font-size:1.5rem;margin-bottom:.3rem;
      background:linear-gradient(135deg,${data.color},#FF4FA3);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
      🎤 Karaoke — Encuentra dónde cantar
    </h2>
  </div>
  <script>
    (function(){
      var w = document.getElementById("_karaoke_voz_wrap");
      if(w && typeof buildKaraokeSection === "function"){
        w.innerHTML += buildKaraokeSection("${capSlug}", "${slug}");
      }
    })();
  <\/script>

  <!-- CTA FINAL -->
  <div class="cta-box" style="margin:0 0 2.5rem">
    <h2>¿Eres ${capSlug}? Compruébalo en segundos</h2>
    <p>Análisis vocal gratuito. Sin registro. Descubre tu tipo de voz con IA.</p>
    <a class="btn" href="/#app">🎤 Analizar mi voz gratis</a>
    &nbsp;&nbsp;
    <a class="btn-out" href="/">Ver todos los tipos de voz</a>
  </div>

</div>

<footer>
  <div class="fl">
    <a href="/">Inicio</a>
    <a href="/voz/baritono">Barítono</a>
    <a href="/voz/tenor">Tenor</a>
    <a href="/voz/soprano">Soprano</a>
    <a href="/voz/mezzo-soprano">Mezzo</a>
    <a href="/voz/contralto">Contralto</a>
    <a href="/voz/bajo">Bajo</a>
    <a href="https://ko-fi.com/harmiq" target="_blank">☕ Apoya Harmiq</a>
  </div>
  <p>© 2025 Harmiq · Análisis vocal con IA · <a href="mailto:hola@harmiq.app">hola@harmiq.app</a></p>
</footer>

<script>
  // Precargar fotos de artistas tras render
  const artistData = ${JSON.stringify(data.artistImgs||{})};
  const monoImgs = typeof MONO_IMGS !== 'undefined' ? MONO_IMGS : {};
  document.querySelectorAll('img[alt]').forEach(img => {
    const name = img.alt;
    const src = artistData[name] || monoImgs[name];
    if (src) img.src = src;
  });
</script>

</body></html>`;
  return true;
}

// ── Cargador de páginas SPA con preservación de resultado ─────────────────────
function loadStaticPage(url, title) {
  // Guardar resultado en sessionStorage para restaurarlo al volver
  if (lastResult?.matches?.length) {
    try {
      sessionStorage.setItem("harmiq_result", JSON.stringify({
        vt: lastResult.vt, conf: lastResult.conf, gender: lastResult.gender,
        feat: lastResult.feat,
        matches: lastResult.matches.map(m => ({
          id:m.id, name:m.name, voice_type:m.voice_type,
          genre_category:m.genre_category, country_code:m.country_code,
          era:m.era, score:m.score, reference_songs:m.reference_songs?.slice(0,3)||[]
        }))
      }));
    } catch(_) {}
  }
  // Navegar directamente — cada página tiene su propio CSS completo
  location.href = url;
}

// ── Router SPA ─────────────────────────────────────────────────────────────────
function handleRoute() {
  const path = location.pathname;

  // Rutas /voz/*
  const vMatch = path.match(/^\/voz\/(.+)$/);
  if (vMatch) {
    const slug = vMatch[1].toLowerCase().replace(/[^a-z-]/g,'');
    // Normalizar: "mezzo soprano" → "mezzo-soprano", "bajo" ok
    const validSlugs = ["baritono","tenor","soprano","mezzo-soprano","contralto","bajo"];
    if (validSlugs.includes(slug)) {
      renderVozPage(slug);
    } else {
      history.replaceState({}, "", "/");
    }
    return true;
  }

  // Rutas páginas internas SPA
  if (path === "/home-studio") {
    loadStaticPage("/home-studio.html", "🎛️ Home Studio | Harmiq");
    return true;
  }
  if (path === "/karaoke-eventos") {
    loadStaticPage("/karaoke-eventos.html", "🎤 Karaoke & Eventos | Harmiq");
    return true;
  }
  if (path === "/modul-catala") {
    loadStaticPage("/modul-catala.html", "🏴 Mòdul Català | Harmiq");
    return true;
  }
  if (path === "/tipos-de-voz") {
    loadStaticPage("/tipos-de-voz.html", "📖 Tipos de Voz | Harmiq");
    return true;
  }
  if (path === "/ejercicios-de-canto") {
    loadStaticPage("/ejercicios-de-canto.html", "🎯 Ejercicios de Canto | Harmiq");
    return true;
  }
  if (path === "/exitos-decada") {
    loadStaticPage("/exitos-decada.html", "🎵 Éxitos por Década | Harmiq");
    return true;
  }

  // Rutas SEO de texto → redirigen al inicio con ancla
  if (path === "/que-tipo-de-voz-tengo" || path === "/que-cantante-soy") {
    history.replaceState({}, "", "/#app");
    document.getElementById("app")?.scrollIntoView({behavior:"smooth"});
    return false;
  }

  return false;
}

// Interceptar clicks SPA
document.addEventListener("click", e => {
  const a = e.target.closest("a[href]");
  if (!a) return;
  const href = a.getAttribute("href");
  const spaRoutes = ["/home-studio", "/karaoke-eventos", "/modul-catala", "/tipos-de-voz", "/ejercicios-de-canto", "/exitos-decada"];
  if (href?.startsWith("/voz/") || spaRoutes.includes(href)) {
    e.preventDefault();
    history.pushState({}, "", href);
    handleRoute();
    window.scrollTo(0,0);
  }
});
window.addEventListener("popstate", () => handleRoute());

// ═══════════════════════════════════════════════════════════════════════════════
// 12. HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
function showStatus(msg, type="ok") {
  const el = document.getElementById("status-msg");
  if (!el) return;
  el.textContent  = msg;
  el.style.color  = type==="err" ? "#ef4444" : "#7C4DFF";
  el.style.display= msg ? "block" : "none";
}

// ═══════════════════════════════════════════════════════════════════════════════
// 13. CARGAR DB
// ═══════════════════════════════════════════════════════════════════════════════
// ── Buscador de karaoke por ciudad ────────────────────────────────────────────
function _searchKaraoke() {
  const city = document.getElementById("_karaoke_city")?.value?.trim();
  if (!city) return;
  const enc = encodeURIComponent(city);
  const resDiv = document.getElementById("_karaoke_results");
  if (resDiv) resDiv.style.display = "block";

  const barsEl = document.getElementById("_kr_bars");
  const micsEl = document.getElementById("_kr_mics");
  const compEl = document.getElementById("_kr_companies");
  const evtEl  = document.getElementById("_kr_events");

  if (barsEl) barsEl.href = `https://www.google.com/maps/search/karaoke+bares+${enc}`;
  if (micsEl) micsEl.href = `https://www.google.com/maps/search/open+mic+jam+session+${enc}`;
  if (compEl) compEl.href = `https://www.google.com/maps/search/empresa+karaoke+${enc}`;
  if (evtEl)  evtEl.href  = `https://www.eventbrite.es/d/${enc}/concurso-canto-karaoke/`;
}

async function loadDB() {
  try {
    const r = await fetch(DB_PATH);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    singersDb = d.singers || [];
    console.log(`✓ DB cargada: ${singersDb.length} cantantes`);
    // Actualizar el botón para indicar que está listo
    const recBtn = document.getElementById("record-btn");
    if (recBtn) recBtn.style.opacity = "1";
    if (singersDb.length === 0) console.warn("⚠️ DB vacía — revisa harmiq_db_vectores.json");
  } catch(e) {
    console.error("❌ DB no disponible:", e.message);
    // Mostrar aviso suave al usuario solo si lleva mucho tiempo
    setTimeout(() => {
      if (!singersDb.length) showStatus("Base de datos cargando... Espera un momento.", "ok");
      setTimeout(() => showStatus(""), 3000);
    }, 2000);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 14. INIT
// ═══════════════════════════════════════════════════════════════════════════════

function showCookieBanner() {
  if (localStorage.getItem("harmiq_consent")==="1") return;
  if (document.getElementById("_cookie_banner")) return;
  const b=document.createElement("div");b.id="_cookie_banner";
  b.style.cssText="position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#0f0c1f;border-top:1px solid rgba(124,77,255,.4);padding:.8rem 1.4rem;display:flex;align-items:center;flex-wrap:wrap;gap:.6rem;justify-content:space-between;font-family:'Nunito',sans-serif;";
  b.innerHTML=`<p style="flex:1;min-width:220px;font-size:.76rem;color:#D1D5DB;margin:0">🍪 Usamos localStorage solo para tus preferencias. Tu audio <strong style="color:#06D6A0">no se almacena</strong>. <a href="/politica-privacidad" style="color:#A5B4FC">Privacidad</a></p><button id="_ca" style="background:linear-gradient(135deg,#7C4DFF,#FF4FA3);color:#fff;border:none;padding:.45rem 1rem;border-radius:8px;font-weight:700;font-size:.78rem;cursor:pointer;font-family:'Nunito',sans-serif">✓ Entendido</button>`;
  document.body.appendChild(b);
  document.getElementById("_ca").onclick=()=>{localStorage.setItem("harmiq_consent","1");b.style.opacity="0";setTimeout(()=>b.remove(),300);};
}

document.addEventListener("DOMContentLoaded", async () => {
  showCookieBanner();

  // Idioma
  const saved   = localStorage.getItem("harmiq_lang");
  const urlLang = new URLSearchParams(location.search).get("lang");
  const browser = (navigator.language||"es").substring(0,2);
  const initL   = urlLang || saved || (T[browser] ? browser : "es");
  lang = initL;

  // Detectar país (async, no bloquea)
  detectCountry().catch(()=>{});

  // ¿Estamos en una ruta /voz/*?
  if (handleRoute()) return;

  // Aplicar idioma al HTML estático
  changeLang(initL);

  // Inyectar UI dinámica
  injectUI();

  // Botón grabar
  const btn = document.getElementById("record-btn");
  if (btn) {
    btn.onclick = async () => {
      // Si no eligió género, auto-seleccionar "auto" silenciosamente
      const sel = document.getElementById("user-gender");
      if (sel && !sel.value) {
        sel.value = "auto";
        _setGender("auto", document.getElementById("_gbtn_auto"));
      }
      if (!isRec && audioBlob) {
        await analyzeAudio();
      } else {
        await toggleRecording();
      }
    };
  }

  // Cargar DB
  await loadDB();

  // Restaurar resultado previo si el usuario volvió a la página
  const savedResult = sessionStorage.getItem("harmiq_result");
  if (savedResult) {
    try {
      const r = JSON.parse(savedResult);
      if (r?.matches?.length && r?.vt) {
        lastResult = r;
        // Asegurar que vec existe (puede no estar en sessionStorage)
        if (!lastResult.vec) lastResult.vec = new Array(27).fill(0.5);
        // Precargar fotos y renderizar
        await preloadImages(r.matches.map(m => m.name));
        renderResults(lastResult);
        // Scroll suave al resultado
        setTimeout(() => {
          document.getElementById("results")?.scrollIntoView({behavior:"smooth"});
        }, 300);
      }
    } catch(_) {}
  }
});
