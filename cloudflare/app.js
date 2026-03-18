/* =====================================================
   HARMIQ - app.js GLOBAL
   IA real + i18n 11 idiomas + Amazon global
   + plataformas por región + compartir viral
   ===================================================== */

const HF_API_URL = "https://hamiq-harmiq-api-v1.hf.space/analyze";
const AFFILIATE_ID = "harmiqapp-20";

let monetization = null;
let voiceDB = [];
let userRegion = "ES";
let userLang = "es";
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

/* =====================================================
   TRADUCCIONES (i18n)
   ===================================================== */
const I18N = {
  es: {
    tagline:        "Descubre a qué cantante te pareces",
    genderDefault:  "Selecciona género vocal",
    male:           "Hombre",
    female:         "Mujer",
    btnRecord:      "🎤 Analizar voz",
    btnStop:        "⏹ Detener y Analizar",
    recording:      "🔴 Grabando... Canta unos segundos y pulsa detener.",
    analyzing:      "⏳ Analizando tu voz con IA...",
    resultTitle:    "Tu voz se parece a",
    voiceType:      "Tipo de voz detectado",
    micsTitle:      "🎤 Micrófonos Recomendados",
    proTitle:       "🎧 Referencias PRO",
    studioTitle:    "🏠 Home Studio por Nivel",
    songsTitle:     "🎵 Canciones de referencia",
    charsTitle:     "👾 Personajes con tu tipo de voz",
    mediaTitle:     "🎬 Inspírate",
    shareTitle:     "📲 Compartir",
    shareText:      "🔥 Mi voz suena como {name} 😳 ¿y la tuya? Descúbrelo gratis en harmiq.app",
    feedbackTitle:  "¿El resultado es correcto?",
    feedbackThanks: "¡Gracias! 🙌",
    eventsTitle:    "🎤 Karaoke cerca de ti",
    eventsLink:     "Buscar karaokes",
    amazonBtn:      "🛒 Ver en Amazon",
    errorMic:       "⚠️ No se pudo acceder al micrófono.",
    errorAPI:       "⚠️ No se pudo conectar con la IA. Inténtalo de nuevo.",
    legal:          "Harmiq no está afiliado a artistas ni marcas. Uso educativo.",
    privacy:        "Privacidad",
    cookies:        "Cookies",
    studioLevels:   { fun: "🎮 Fun / Empezar", basic: "⭐ Básico", medium: "🔥 Intermedio", pro: "💎 Pro" }
  },
  ca: {
    tagline:        "Descobreix a quin cantant t'assembles",
    genderDefault:  "Selecciona gènere vocal",
    male:           "Home",
    female:         "Dona",
    btnRecord:      "🎤 Analitza la veu",
    btnStop:        "⏹ Atura i Analitza",
    recording:      "🔴 Gravant... Canta uns segons i prem atura.",
    analyzing:      "⏳ Analitzant la teva veu amb IA...",
    resultTitle:    "La teva veu s'assembla a",
    voiceType:      "Tipus de veu detectat",
    micsTitle:      "🎤 Micròfons Recomanats",
    proTitle:       "🎧 Referències PRO",
    studioTitle:    "🏠 Home Studio per Nivell",
    songsTitle:     "🎵 Cançons de referència",
    charsTitle:     "👾 Personatges amb el teu tipus de veu",
    mediaTitle:     "🎬 Inspira't",
    shareTitle:     "📲 Compartir",
    shareText:      "🔥 La meva veu sona com {name} 😳 I la teva? Descobreix-ho gratis a harmiq.app",
    feedbackTitle:  "El resultat és correcte?",
    feedbackThanks: "Gràcies! 🙌",
    eventsTitle:    "🎤 Karaoke a prop teu",
    eventsLink:     "Buscar karaokes",
    amazonBtn:      "🛒 Veure a Amazon",
    errorMic:       "⚠️ No s'ha pogut accedir al micròfon.",
    errorAPI:       "⚠️ No s'ha pogut connectar amb la IA. Torna-ho a intentar.",
    legal:          "Harmiq no està afiliat a artistes ni marques. Ús educatiu.",
    privacy:        "Privadesa",
    cookies:        "Galetes",
    studioLevels:   { fun: "🎮 Fun / Començar", basic: "⭐ Bàsic", medium: "🔥 Intermedi", pro: "💎 Pro" }
  },
  en: {
    tagline:        "Discover which singer your voice matches",
    genderDefault:  "Select vocal range",
    male:           "Male",
    female:         "Female",
    btnRecord:      "🎤 Analyze my voice",
    btnStop:        "⏹ Stop & Analyze",
    recording:      "🔴 Recording... Sing for a few seconds then press stop.",
    analyzing:      "⏳ Analyzing your voice with AI...",
    resultTitle:    "Your voice sounds like",
    voiceType:      "Detected voice type",
    micsTitle:      "🎤 Recommended Microphones",
    proTitle:       "🎧 PRO References",
    studioTitle:    "🏠 Home Studio by Level",
    songsTitle:     "🎵 Reference songs",
    charsTitle:     "👾 Characters with your voice type",
    mediaTitle:     "🎬 Get inspired",
    shareTitle:     "📲 Share",
    shareText:      "🔥 My voice sounds like {name} 😳 What about yours? Try it free at harmiq.app",
    feedbackTitle:  "Was the result accurate?",
    feedbackThanks: "Thanks! 🙌",
    eventsTitle:    "🎤 Karaoke near you",
    eventsLink:     "Find karaoke venues",
    amazonBtn:      "🛒 View on Amazon",
    errorMic:       "⚠️ Could not access microphone.",
    errorAPI:       "⚠️ Could not connect to AI. Please try again.",
    legal:          "Harmiq is not affiliated with any artists or brands. Educational use only.",
    privacy:        "Privacy",
    cookies:        "Cookies",
    studioLevels:   { fun: "🎮 Fun / Starter", basic: "⭐ Basic", medium: "🔥 Intermediate", pro: "💎 Pro" }
  },
  ja: {
    tagline:        "あなたの声はどの歌手に似ている？",
    genderDefault:  "声域を選択",
    male:           "男性",
    female:         "女性",
    btnRecord:      "🎤 声を分析する",
    btnStop:        "⏹ 停止して分析",
    recording:      "🔴 録音中... 数秒歌って停止を押してください。",
    analyzing:      "⏳ AIが声を分析中...",
    resultTitle:    "あなたの声に似ているのは",
    voiceType:      "検出された声のタイプ",
    micsTitle:      "🎤 おすすめマイク",
    proTitle:       "🎧 プロ用マイク",
    studioTitle:    "🏠 ホームスタジオ レベル別",
    songsTitle:     "🎵 参考曲",
    charsTitle:     "👾 同じ声タイプのキャラクター",
    mediaTitle:     "🎬 インスピレーション",
    shareTitle:     "📲 シェア",
    shareText:      "🔥 私の声は{name}に似ています😳あなたは？harmiq.appで無料チェック！",
    feedbackTitle:  "結果は正確でしたか？",
    feedbackThanks: "ありがとう！ 🙌",
    eventsTitle:    "🎤 近くのカラオケ",
    eventsLink:     "カラオケを探す",
    amazonBtn:      "🛒 Amazonで見る",
    errorMic:       "⚠️ マイクにアクセスできませんでした。",
    errorAPI:       "⚠️ AIに接続できませんでした。もう一度お試しください。",
    legal:          "Harmiqはアーティストやブランドとは無関係です。教育目的のみ。",
    privacy:        "プライバシー",
    cookies:        "クッキー",
    studioLevels:   { fun: "🎮 入門", basic: "⭐ ベーシック", medium: "🔥 中級", pro: "💎 プロ" }
  },
  zh: {
    tagline:        "发现你的声音像哪位歌手",
    genderDefault:  "选择声域",
    male:           "男声",
    female:         "女声",
    btnRecord:      "🎤 分析我的声音",
    btnStop:        "⏹ 停止并分析",
    recording:      "🔴 录音中... 唱几秒钟后按停止。",
    analyzing:      "⏳ AI正在分析你的声音...",
    resultTitle:    "你的声音像",
    voiceType:      "检测到的声音类型",
    micsTitle:      "🎤 推荐麦克风",
    proTitle:       "🎧 专业参考",
    studioTitle:    "🏠 家庭录音室分级",
    songsTitle:     "🎵 参考歌曲",
    charsTitle:     "👾 与你声音类型相同的角色",
    mediaTitle:     "🎬 获取灵感",
    shareTitle:     "📲 分享",
    shareText:      "🔥 我的声音像{name}😳你的呢？在harmiq.app免费测试！",
    feedbackTitle:  "结果准确吗？",
    feedbackThanks: "谢谢！ 🙌",
    eventsTitle:    "🎤 附近的卡拉OK",
    eventsLink:     "查找卡拉OK场所",
    amazonBtn:      "🛒 在亚马逊查看",
    errorMic:       "⚠️ 无法访问麦克风。",
    errorAPI:       "⚠️ 无法连接到AI，请重试。",
    legal:          "Harmiq与任何艺术家或品牌无关。仅供教育使用。",
    privacy:        "隐私",
    cookies:        "Cookie",
    studioLevels:   { fun: "🎮 入门", basic: "⭐ 基础", medium: "🔥 中级", pro: "💎 专业" }
  },
  ru: {
    tagline:        "Узнай, на какого певца похож твой голос",
    genderDefault:  "Выберите голосовой диапазон",
    male:           "Мужской",
    female:         "Женский",
    btnRecord:      "🎤 Анализировать голос",
    btnStop:        "⏹ Стоп и Анализ",
    recording:      "🔴 Запись... Спойте несколько секунд и нажмите стоп.",
    analyzing:      "⏳ ИИ анализирует твой голос...",
    resultTitle:    "Твой голос похож на",
    voiceType:      "Определённый тип голоса",
    micsTitle:      "🎤 Рекомендуемые микрофоны",
    proTitle:       "🎧 Профессиональные микрофоны",
    studioTitle:    "🏠 Домашняя студия по уровням",
    songsTitle:     "🎵 Песни для ориентира",
    charsTitle:     "👾 Персонажи с похожим голосом",
    mediaTitle:     "🎬 Вдохновляйся",
    shareTitle:     "📲 Поделиться",
    shareText:      "🔥 Мой голос звучит как {name} 😳 А твой? Узнай бесплатно на harmiq.app",
    feedbackTitle:  "Результат верный?",
    feedbackThanks: "Спасибо! 🙌",
    eventsTitle:    "🎤 Караоке рядом",
    eventsLink:     "Найти караоке",
    amazonBtn:      "🛒 Посмотреть на Amazon",
    errorMic:       "⚠️ Нет доступа к микрофону.",
    errorAPI:       "⚠️ Не удалось подключиться к ИИ. Попробуйте снова.",
    legal:          "Harmiq не связан с артистами или брендами. Только для образовательных целей.",
    privacy:        "Конфиденциальность",
    cookies:        "Куки",
    studioLevels:   { fun: "🎮 Старт", basic: "⭐ Базовый", medium: "🔥 Средний", pro: "💎 Про" }
  },
  uk: {
    tagline:        "Дізнайся, на якого співака схожий твій голос",
    genderDefault:  "Оберіть діапазон голосу",
    male:           "Чоловічий",
    female:         "Жіночий",
    btnRecord:      "🎤 Аналізувати голос",
    btnStop:        "⏹ Зупинити та Аналізувати",
    recording:      "🔴 Запис... Поспівай кілька секунд і натисни стоп.",
    analyzing:      "⏳ ШІ аналізує твій голос...",
    resultTitle:    "Твій голос схожий на",
    voiceType:      "Визначений тип голосу",
    micsTitle:      "🎤 Рекомендовані мікрофони",
    proTitle:       "🎧 Професійні мікрофони",
    studioTitle:    "🏠 Домашня студія за рівнями",
    songsTitle:     "🎵 Пісні для орієнтиру",
    charsTitle:     "👾 Персонажі зі схожим голосом",
    mediaTitle:     "🎬 Надихайся",
    shareTitle:     "📲 Поділитися",
    shareText:      "🔥 Мій голос звучить як {name} 😳 А твій? Дізнайся безкоштовно на harmiq.app",
    feedbackTitle:  "Результат правильний?",
    feedbackThanks: "Дякую! 🙌",
    eventsTitle:    "🎤 Karaoke поруч",
    eventsLink:     "Знайти karaoke",
    amazonBtn:      "🛒 Переглянути на Amazon",
    errorMic:       "⚠️ Немає доступу до мікрофона.",
    errorAPI:       "⚠️ Не вдалося підключитися до ШІ. Спробуй ще раз.",
    legal:          "Harmiq не пов'язаний з артистами чи брендами. Лише для освітніх цілей.",
    privacy:        "Конфіденційність",
    cookies:        "Куки",
    studioLevels:   { fun: "🎮 Старт", basic: "⭐ Базовий", medium: "🔥 Середній", pro: "💎 Про" }
  },
  fr: {
    tagline:        "Découvre à quel chanteur ressemble ta voix",
    genderDefault:  "Sélectionne la voix",
    male:           "Homme",
    female:         "Femme",
    btnRecord:      "🎤 Analyser ma voix",
    btnStop:        "⏹ Arrêter et Analyser",
    recording:      "🔴 Enregistrement... Chante quelques secondes puis arrête.",
    analyzing:      "⏳ L'IA analyse ta voix...",
    resultTitle:    "Ta voix ressemble à",
    voiceType:      "Type de voix détecté",
    micsTitle:      "🎤 Microphones Recommandés",
    proTitle:       "🎧 Références PRO",
    studioTitle:    "🏠 Home Studio par Niveau",
    songsTitle:     "🎵 Chansons de référence",
    charsTitle:     "👾 Personnages avec ta voix",
    mediaTitle:     "🎬 Inspire-toi",
    shareTitle:     "📲 Partager",
    shareText:      "🔥 Ma voix ressemble à {name} 😳 Et la tienne ? Découvre-le gratuitement sur harmiq.app",
    feedbackTitle:  "Le résultat est-il correct ?",
    feedbackThanks: "Merci ! 🙌",
    eventsTitle:    "🎤 Karaoké près de toi",
    eventsLink:     "Trouver des karaokés",
    amazonBtn:      "🛒 Voir sur Amazon",
    errorMic:       "⚠️ Impossible d'accéder au microphone.",
    errorAPI:       "⚠️ Impossible de se connecter à l'IA. Réessaie.",
    legal:          "Harmiq n'est affilié à aucun artiste ou marque. Usage éducatif.",
    privacy:        "Confidentialité",
    cookies:        "Cookies",
    studioLevels:   { fun: "🎮 Débutant", basic: "⭐ Basique", medium: "🔥 Intermédiaire", pro: "💎 Pro" }
  },
  de: {
    tagline:        "Entdecke, welchem Sänger deine Stimme ähnelt",
    genderDefault:  "Stimmbereich auswählen",
    male:           "Männlich",
    female:         "Weiblich",
    btnRecord:      "🎤 Stimme analysieren",
    btnStop:        "⏹ Stopp & Analysieren",
    recording:      "🔴 Aufnahme... Sing ein paar Sekunden und drück Stopp.",
    analyzing:      "⏳ KI analysiert deine Stimme...",
    resultTitle:    "Deine Stimme klingt wie",
    voiceType:      "Erkannter Stimmtyp",
    micsTitle:      "🎤 Empfohlene Mikrofone",
    proTitle:       "🎧 Profi-Referenzen",
    studioTitle:    "🏠 Home Studio nach Level",
    songsTitle:     "🎵 Referenzlieder",
    charsTitle:     "👾 Charaktere mit deinem Stimmtyp",
    mediaTitle:     "🎬 Lass dich inspirieren",
    shareTitle:     "📲 Teilen",
    shareText:      "🔥 Meine Stimme klingt wie {name} 😳 Und deine? Teste es kostenlos auf harmiq.app",
    feedbackTitle:  "War das Ergebnis korrekt?",
    feedbackThanks: "Danke! 🙌",
    eventsTitle:    "🎤 Karaoke in deiner Nähe",
    eventsLink:     "Karaoke finden",
    amazonBtn:      "🛒 Auf Amazon ansehen",
    errorMic:       "⚠️ Kein Zugriff auf das Mikrofon.",
    errorAPI:       "⚠️ Keine Verbindung zur KI. Bitte erneut versuchen.",
    legal:          "Harmiq ist mit keinen Künstlern oder Marken verbunden. Nur zu Bildungszwecken.",
    privacy:        "Datenschutz",
    cookies:        "Cookies",
    studioLevels:   { fun: "🎮 Einsteiger", basic: "⭐ Basic", medium: "🔥 Mittel", pro: "💎 Profi" }
  },
  it: {
    tagline:        "Scopri a quale cantante assomiglia la tua voce",
    genderDefault:  "Seleziona la voce",
    male:           "Uomo",
    female:         "Donna",
    btnRecord:      "🎤 Analizza la voce",
    btnStop:        "⏹ Ferma e Analizza",
    recording:      "🔴 Registrazione... Canta per qualche secondo poi ferma.",
    analyzing:      "⏳ L'IA sta analizzando la tua voce...",
    resultTitle:    "La tua voce assomiglia a",
    voiceType:      "Tipo di voce rilevato",
    micsTitle:      "🎤 Microfoni Consigliati",
    proTitle:       "🎧 Riferimenti PRO",
    studioTitle:    "🏠 Home Studio per Livello",
    songsTitle:     "🎵 Canzoni di riferimento",
    charsTitle:     "👾 Personaggi con la tua voce",
    mediaTitle:     "🎬 Ispirati",
    shareTitle:     "📲 Condividi",
    shareText:      "🔥 La mia voce suona come {name} 😳 E la tua? Scoprilo gratis su harmiq.app",
    feedbackTitle:  "Il risultato è corretto?",
    feedbackThanks: "Grazie! 🙌",
    eventsTitle:    "🎤 Karaoke vicino a te",
    eventsLink:     "Trova karaoke",
    amazonBtn:      "🛒 Vedi su Amazon",
    errorMic:       "⚠️ Impossibile accedere al microfono.",
    errorAPI:       "⚠️ Impossibile connettersi all'IA. Riprova.",
    legal:          "Harmiq non è affiliato ad artisti o marchi. Solo uso educativo.",
    privacy:        "Privacy",
    cookies:        "Cookie",
    studioLevels:   { fun: "🎮 Principiante", basic: "⭐ Base", medium: "🔥 Intermedio", pro: "💎 Pro" }
  },
  pt: {
    tagline:        "Descubra a qual cantor sua voz se parece",
    genderDefault:  "Selecione a voz",
    male:           "Masculino",
    female:         "Feminino",
    btnRecord:      "🎤 Analisar minha voz",
    btnStop:        "⏹ Parar e Analisar",
    recording:      "🔴 Gravando... Cante alguns segundos e pressione parar.",
    analyzing:      "⏳ A IA está analisando sua voz...",
    resultTitle:    "Sua voz se parece com",
    voiceType:      "Tipo de voz detectado",
    micsTitle:      "🎤 Microfones Recomendados",
    proTitle:       "🎧 Referências PRO",
    studioTitle:    "🏠 Home Studio por Nível",
    songsTitle:     "🎵 Músicas de referência",
    charsTitle:     "👾 Personagens com seu tipo de voz",
    mediaTitle:     "🎬 Inspire-se",
    shareTitle:     "📲 Compartilhar",
    shareText:      "🔥 Minha voz soa como {name} 😳 E a sua? Descubra grátis em harmiq.app",
    feedbackTitle:  "O resultado foi correto?",
    feedbackThanks: "Obrigado! 🙌",
    eventsTitle:    "🎤 Karaokê perto de você",
    eventsLink:     "Encontrar karaokê",
    amazonBtn:      "🛒 Ver na Amazon",
    errorMic:       "⚠️ Não foi possível acessar o microfone.",
    errorAPI:       "⚠️ Não foi possível conectar à IA. Tente novamente.",
    legal:          "Harmiq não é afiliado a artistas ou marcas. Apenas uso educacional.",
    privacy:        "Privacidade",
    cookies:        "Cookies",
    studioLevels:   { fun: "🎮 Iniciante", basic: "⭐ Básico", medium: "🔥 Intermediário", pro: "💎 Pro" }
  }
};

/* Idiomas para países (fallback por región) */
const REGION_LANG = {
  ES:"es", AD:"ca", // España/Andorra → español/catalán por defecto (usuario elige)
  US:"en", GB:"en", AU:"en", CA:"en", NZ:"en", IE:"en", ZA:"en",
  JP:"ja",
  CN:"zh", TW:"zh", HK:"zh", MO:"zh", SG:"zh",
  RU:"ru", BY:"ru", KZ:"ru",
  UA:"uk",
  FR:"fr", BE:"fr", CH:"fr", LU:"fr",
  DE:"de", AT:"de",
  IT:"it",
  PT:"pt", BR:"pt", AO:"pt", MZ:"pt"
};

/* =====================================================
   PLATAFORMAS DE MÚSICA POR REGIÓN
   ===================================================== */
function getMusicPlatforms(item) {
  const q  = encodeURIComponent(item.spotify || item.title || "");
  const yt = encodeURIComponent(item.youtube || item.title || "");

  // Japón → LINE MUSIC + YouTube Music
  if (userRegion === "JP") {
    return `
      <a class="platform-btn" href="https://music.line.me/search?q=${q}" target="_blank">LINE Music</a>
      <a class="platform-btn" href="https://music.youtube.com/search?q=${yt}" target="_blank">YT Music</a>
      <a class="platform-btn" href="https://www.youtube.com/results?search_query=${yt}" target="_blank">YouTube</a>
    `;
  }
  // China → NetEase + QQ Music + Bilibili
  if (userRegion === "CN") {
    return `
      <a class="platform-btn" href="https://music.163.com/#/search/m/?s=${q}" target="_blank">网易云音乐</a>
      <a class="platform-btn" href="https://y.qq.com/portal/search.html#page=1&searchid=1&query=${q}" target="_blank">QQ音乐</a>
      <a class="platform-btn" href="https://search.bilibili.com/all?keyword=${yt}" target="_blank">Bilibili</a>
    `;
  }
  // Rusia / países CIS → VK Music + YouTube
  if (["RU","BY","KZ","UZ","AM","AZ","GE"].includes(userRegion)) {
    return `
      <a class="platform-btn" href="https://vk.com/audio?q=${q}" target="_blank">VK Music</a>
      <a class="platform-btn" href="https://music.yandex.ru/search?text=${q}" target="_blank">Яндекс Музыка</a>
      <a class="platform-btn" href="https://www.youtube.com/results?search_query=${yt}" target="_blank">YouTube</a>
    `;
  }
  // Corea → Melon + YouTube
  if (userRegion === "KR") {
    return `
      <a class="platform-btn" href="https://www.melon.com/search/total/index.htm?q=${q}" target="_blank">Melon</a>
      <a class="platform-btn" href="https://www.youtube.com/results?search_query=${yt}" target="_blank">YouTube</a>
    `;
  }
  // Default global: Spotify + Apple + YouTube
  return `
    <a class="platform-btn" href="https://open.spotify.com/search/${q}" target="_blank">Spotify</a>
    <a class="platform-btn" href="https://music.apple.com/search?term=${q}" target="_blank">Apple Music</a>
    <a class="platform-btn" href="https://www.youtube.com/results?search_query=${yt}" target="_blank">YouTube</a>
  `;
}

/* =====================================================
   AMAZON GLOBAL
   ===================================================== */
function getAmazonDomain() {
  const map = {
    US:"com", CA:"ca", MX:"com.mx", BR:"com.br",
    GB:"co.uk", DE:"de", FR:"fr", IT:"it", ES:"es",
    NL:"nl", PL:"pl", SE:"se", TR:"com.tr",
    JP:"co.jp", CN:"cn", IN:"in", AU:"com.au", SG:"com.sg",
    AE:"ae", SA:"sa", EG:"eg"
  };
  return map[userRegion] || "es";
}

function amazonLink(query) {
  const domain = getAmazonDomain();
  return `https://www.amazon.${domain}/s?k=${encodeURIComponent(query)}&tag=${AFFILIATE_ID}`;
}

/* Texto del botón Amazon según idioma */
function amazonBtn(query) {
  const t = I18N[userLang] || I18N.es;
  return `<a class="btn-amazon" href="${amazonLink(query)}" target="_blank">${t.amazonBtn}</a>`;
}

/* =====================================================
   BOTONES COMPARTIR POR REGIÓN
   ===================================================== */
function getShareButtons(text) {
  const enc = encodeURIComponent(text);
  const base = `
    <button class="share-btn" onclick="window.open('https://wa.me/?text=${enc}')">WhatsApp</button>
    <button class="share-btn" onclick="navigator.clipboard.writeText('${text.replace(/'/g,"\\'")}').then(()=>alert('Copiado!'))">📋 Copy</button>
  `;

  if (userRegion === "JP") {
    return base + `<button class="share-btn line" onclick="window.open('https://social-plugins.line.me/lineit/share?url=${encodeURIComponent('https://harmiq.app')}&text=${enc}')">LINE</button>`;
  }
  if (userRegion === "CN") {
    return base + `<button class="share-btn weibo" onclick="window.open('https://service.weibo.com/share/share.php?title=${enc}&url=${encodeURIComponent('https://harmiq.app')}')">微博</button>`;
  }
  if (["RU","BY","UA","KZ"].includes(userRegion)) {
    return base + `<button class="share-btn vk" onclick="window.open('https://vk.com/share.php?url=${encodeURIComponent('https://harmiq.app')}&title=${enc}')">VK</button>`;
  }

  return base + `<button class="share-btn" onclick="window.open('https://twitter.com/intent/tweet?text=${enc}')">Twitter / X</button>`;
}

/* =====================================================
   BÚSQUEDA KARAOKE POR REGIÓN
   ===================================================== */
function getKaraokeSearch() {
  const queries = {
    JP: "カラオケ 近く",
    CN: "附近卡拉OK",
    KR: "근처 노래방",
    RU: "Kaраоке рядом",
    UK: "karaoke nearby"
  };
  return queries[userRegion] || `karaoke cerca`;
}

/* =====================================================
   INIT
   ===================================================== */
window.onload = async () => {
  // Detectar región e idioma
  try {
    const geo = await fetch("https://ipapi.co/json/").then(r => r.json());
    userRegion = geo.country_code || "ES";
  } catch {}

  // Detectar idioma preferido del navegador
  const browserLang = (navigator.language || navigator.userLanguage || "es").slice(0,2).toLowerCase();
  userLang = I18N[browserLang] ? browserLang : (REGION_LANG[userRegion] || "es");

  // Leer ?lang= de la URL si existe
  const urlLang = new URLSearchParams(window.location.search).get("lang");
  if (urlLang && I18N[urlLang]) userLang = urlLang;

  // Cargar datos
  try {
    monetization = await fetch("monetization.json").then(r => r.json());
  } catch (err) {
    console.error("Error cargando monetization.json:", err);
  }

  try {
    voiceDB = await fetch("harmiq_db_vectores.json").then(r => r.json());
  } catch {}

  // Aplicar idioma
  applyLang(userLang);

  // Eventos
  document.getElementById("record-btn").onclick = toggleRecording;
  document.getElementById("lang-select").value = userLang;

  loadEvents();
};

/* =====================================================
   CAMBIO DE IDIOMA
   ===================================================== */
function changeLang(lang) {
  if (!I18N[lang]) return;
  userLang = lang;
  applyLang(lang);
  // Actualizar URL sin recargar
  const url = new URL(window.location);
  url.searchParams.set("lang", lang);
  window.history.replaceState({}, "", url);
}

function applyLang(lang) {
  const t = I18N[lang] || I18N.es;
  const html = document.documentElement;
  html.lang = lang;

  setText("tagline",           t.tagline);
  setText("opt-gender-default",t.genderDefault);
  setText("opt-male",          t.male);
  setText("opt-female",        t.female);
  setText("record-btn",        isRecording ? t.btnStop : t.btnRecord);
  setText("footer-legal",      t.legal);
  setText("footer-privacy",    t.privacy);
  setText("footer-cookies",    t.cookies);
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setStatus(msg) {
  const el = document.getElementById("status-msg");
  if (el) el.textContent = msg;
}

/* =====================================================
   GRABACIÓN DE AUDIO
   ===================================================== */
async function toggleRecording() {
  const t   = I18N[userLang] || I18N.es;
  const btn = document.getElementById("record-btn");

  if (!isRecording) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        await sendAudio(blob);
        stream.getTracks().forEach(tr => tr.stop());
      };

      mediaRecorder.start();
      isRecording = true;
      btn.textContent = t.btnStop;
      btn.style.background = "#cc0000";
      setStatus(t.recording);

    } catch (err) {
      setStatus(t.errorMic + " " + err.message);
    }

  } else {
    mediaRecorder.stop();
    isRecording = false;
    btn.textContent = t.btnRecord;
    btn.style.background = "#ff9900";
    setStatus(t.analyzing);
  }
}

/* =====================================================
   ENVIAR AUDIO A HF API
   ===================================================== */
async function sendAudio(blob) {
  const t = I18N[userLang] || I18N.es;
  try {
    const fd = new FormData();
    fd.append("file", blob, "voice.webm");

    const res  = await fetch(HF_API_URL, { method: "POST", body: fd });
    const data = await res.json();

    if (data.error) { setStatus("⚠️ " + data.error); return; }

    // Usar voice_type de la API si llega, si no: cosine sobre voiceDB
    let voiceType = data.voice_type || null;

    if (!voiceType && voiceDB.length > 0 && data.embedding) {
      const matches = findMatches(data);
      voiceType = matches[0]?.voiceType || "Tenor";
    }

    voiceType = voiceType || classifyByPitch(data.pitch_mean || 0);

    setStatus("");
    renderAll({ name: getArtistName(voiceType), score: 95 }, voiceType);

  } catch (err) {
    setStatus(t.errorAPI);
    console.error(err);
  }
}

/* Clasificación por pitch si no hay embedding ni voice_type */
function classifyByPitch(pitch) {
  if (pitch <= 0)    return "Tenor";
  if (pitch < 160)   return "Baritono";
  if (pitch < 300)   return "Tenor";
  if (pitch < 500)   return "Mezzo";
  return "Soprano";
}

/* =====================================================
   COSINE SIMILARITY (matching con voiceDB)
   ===================================================== */
function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const ma  = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const mb  = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return (ma && mb) ? dot / (ma * mb) : 0;
}

function findMatches(user) {
  return voiceDB
    .map(a => ({
      name:      a.name,
      voiceType: a.voiceType || "Tenor",
      score:     cosine(user.embedding, a.features?.embedding) * 100
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function getArtistName(voiceType) {
  const data = monetization?.voice_profiles?.[voiceType];
  return data?.artists?.[0]?.name || voiceType;
}

/* =====================================================
   RENDER COMPLETO
   ===================================================== */
function renderAll(match, voiceType) {
  const t    = I18N[userLang] || I18N.es;
  const data = monetization?.voice_profiles?.[voiceType];

  if (!data) {
    setStatus("⚠️ No data for voice type: " + voiceType);
    return;
  }

  const artist = data.artists[0];

  /* RESULTADO */
  document.getElementById("results").innerHTML = `
    <div class="block">
      <h2>${t.resultTitle} <span style="color:#ff9900">${match.name}</span></h2>
      ${artist.image ? `<img class="artist-img" src="${artist.image}" alt="${artist.name}" onerror="this.style.display='none'">` : ""}
      <p>${t.voiceType}: <strong>${voiceType}</strong></p>
    </div>
  `;

  /* CANCIONES */
  let songsHtml = `<div class="block"><h3>${t.songsTitle}</h3>`;
  (artist.songs || []).forEach(s => { songsHtml += `<p>🎵 ${s}</p>`; });
  songsHtml += `</div>`;
  document.getElementById("studio-area").innerHTML = songsHtml;

  /* PERSONAJES */
  let charsHtml = `<div class="block"><h3>${t.charsTitle}</h3>`;
  (data.characters || []).forEach(c => { charsHtml += `<p>👾 ${c.name}</p>`; });
  charsHtml += `</div>`;
  document.getElementById("pro-area").innerHTML = charsHtml;

  /* MICRÓFONOS */
  let micHtml = `<div class="block"><h3>${t.micsTitle}</h3>`;
  (data.microphones || []).forEach(m => {
    micHtml += `<p><strong>${m.name}</strong> — ${m.comment}</p>${amazonBtn(m.search)}`;
  });
  micHtml += `</div>`;
  document.getElementById("mics-area").innerHTML = micHtml;

  /* COMPARTIR */
  const shareText = t.shareText.replace("{name}", match.name);
  let contentHtml = `
    <div class="block">
      <h3>${t.shareTitle}</h3>
      ${getShareButtons(shareText)}
    </div>
  `;

  /* CARRUSEL MEDIA */
  contentHtml += `<div class="block"><h3>${t.mediaTitle}</h3><div class="carousel-wrapper">
    <button class="nav-btn prev-btn" onclick="this.nextElementSibling.scrollLeft-=250">❮</button>
    <div class="movie-carousel">`;

  (data.media || []).forEach(m => {
    contentHtml += `
      <div class="media-card">
        <img src="${m.image}" alt="${m.title}" onerror="this.style.display='none'">
        <h4>${m.title}</h4>
        <div class="platforms">${getMusicPlatforms(m)}</div>
        ${amazonBtn(m.search)}
      </div>`;
  });

  contentHtml += `</div>
    <button class="nav-btn next-btn" onclick="this.previousElementSibling.scrollLeft+=250">❯</button>
  </div></div>`;

  /* FEEDBACK */
  contentHtml += `
    <div class="block">
      <h3>${t.feedbackTitle}</h3>
      <button class="feedback-btn" onclick="saveFeedback('${match.name}',true)">👍</button>
      <button class="feedback-btn" onclick="saveFeedback('${match.name}',false)">👎</button>
    </div>
  `;

  document.getElementById("content-area").innerHTML = contentHtml;
}

/* =====================================================
   FEEDBACK
   ===================================================== */
function saveFeedback(name, ok) {
  const t = I18N[userLang] || I18N.es;
  try {
    let fb = JSON.parse(localStorage.getItem("harmiq_fb") || "[]");
    fb.push({ name, ok, ts: Date.now(), lang: userLang, region: userRegion });
    localStorage.setItem("harmiq_fb", JSON.stringify(fb));
  } catch {}
  alert(t.feedbackThanks);
}

/* =====================================================
   EVENTOS / KARAOKE CERCANO
   ===================================================== */
function loadEvents() {
  const t     = I18N[userLang] || I18N.es;
  const query = encodeURIComponent(getKaraokeSearch());
  document.getElementById("events-area").innerHTML = `
    <div class="block">
      <h3>${t.eventsTitle}</h3>
      <a class="btn-amazon" style="max-width:260px;margin:auto"
         target="_blank"
         href="https://www.google.com/search?q=${query}">
        📍 ${t.eventsLink}
      </a>
    </div>
  `;
}
