/**
 * Harmiq - Configuración Global Centralizada
 * Versión: 5.5 - Final Production Ready
 */

const CONFIG = {
    // --- SERVIDORES Y APIS ---
    // Tu backend en HuggingFace (asegúrate de que esta URL sea la correcta de tu Space)
    HF_BASE: "https://hamiq-harmiq-backend1.hf.space",
    
    // Identificador de afiliado para Amazon
    AMAZON_ID: "harmiqapp-20",

    // --- CANALES DE YOUTUBE (Karaokes de Amigos y Propios) ---
    YOUTUBE_CHANNELS: {
        // Enlaces "embed" para que funcionen dentro del reproductor de la web
        KARAOKE_CATALA: "https://www.youtube.com/embed/videoseries?list=UU0viIBU7vG0E8heNIrM2hGA",
        KARAOKE_GIRONA: "https://www.youtube.com/embed/videoseries?list=UUEJUHMchUCCld9apTGm_FFQ",
        KARAOKAT: "https://www.youtube.com/embed/KIl2FPuEmpY",
        DEFAULT_PLAYLIST: "https://www.youtube.com/embed/videoseries?list=PLyI_j4w6L_8i87v5tH8u8fO0lVlZf3_3x"
    },

    // --- IDENTIDAD VISUAL (Colores de Marca) ---
    // Si cambias estos códigos aquí, cambiarán en todos los HTML vinculados
    THEME: {
        PRIMARY: "#7C4DFF",    // Púrpura Harmiq
        ACCENT: "#FF4FA3",     // Rosa Vibrante
        GOLD: "#FFD700",       // Dorado Institucional (Senyera/Cultura)
        DARK_BG: "#050410",    // Fondo Negro Espacial
        CARD_BG: "#110D26"     // Fondo de las tarjetas de artistas
    },

    // --- RUTAS DE NAVEGACIÓN ---
    ROUTES: {
        HOME: "index.html",
        PRIVACY: "politica-privacidad.html",
        EVENTS: "karaoke-eventos.html"
    },

    // --- REDES SOCIALES Y CONTACTO ---
    SOCIAL: {
        INSTAGRAM: "https://instagram.com/harmiq_app",
        TIKTOK: "https://tiktok.com/@harmiq",
        YOUTUBE_OFFICIAL: "https://youtube.com/@harmiq",
        EMAIL_SUPPORT: "info@harmiq.app"
    },

    // --- CONFIGURACIÓN TÉCNICA ---
    SETTINGS: {
        APP_NAME: "Harmiq",
        VERSION: "5.5",
        LEGAL_STANDARD: "Global Privacy Standard v2.1 (GDPR/CCPA Compliant)",
        LANG: "ca" // Idioma base: Catalán
    }
};

// Evita que el código de la app pueda modificar la configuración por error
Object.freeze(CONFIG);

// Exportar para Node.js si fuera necesario (opcional)
if (typeof module !== 'undefined') {
    module.exports = CONFIG;
}