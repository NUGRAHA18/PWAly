// src/scripts/config.js

/**
 * ✅ DIPERBAIKI: Mendukung Development dan Production
 *
 * Development (npm run start-dev):
 * - BASE_URL = "" (kosong)
 * - Menggunakan webpack proxy ke https://story-api.dicoding.dev
 *
 * Production (npm run build):
 * - BASE_URL = "https://story-api.dicoding.dev"
 * - Request langsung ke API production
 */

const CONFIG = {
  // ✅ BASE_URL untuk production
  // Di development, webpack dev server akan proxy request ke API
  BASE_URL:
    process.env.NODE_ENV === "production"
      ? "https://story-api.dicoding.dev"
      : "",

  DEFAULT_LANGUAGE: "en-US",

  // ✅ VAPID Public Key dari Dicoding (SUDAH BENAR)
  // Key ini disediakan oleh pihak Dicoding untuk keperluan submission
  // TIDAK PERLU DIGANTI!
  PUSH_NOTIFICATION_VAPID_PUBLIC_KEY:
    "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxb",

  // ✅ TAMBAHAN: Konfigurasi lainnya
  APP_NAME: "StoryShare",
  APP_VERSION: "1.0.0",

  // Cache duration (dalam detik)
  CACHE_DURATION: {
    IMAGES: 30 * 24 * 60 * 60, // 30 hari
    API: 24 * 60 * 60, // 1 hari
    STATIC: 7 * 24 * 60 * 60, // 7 hari
  },

  // API endpoints
  ENDPOINTS: {
    REGISTER: "/register",
    LOGIN: "/v1/login",
    STORIES: "/v1/stories",
    STORY_DETAIL: (id) => `/v1/stories/${id}`,
  },

  // Feature flags
  FEATURES: {
    ENABLE_NOTIFICATIONS: true,
    ENABLE_OFFLINE_MODE: true,
    ENABLE_BACKGROUND_SYNC: true,
    ENABLE_MAP: true,
    ENABLE_CAMERA: true,
  },

  // Limits
  LIMITS: {
    MAX_PHOTO_SIZE: 1 * 1024 * 1024, // 1MB
    MAX_DESCRIPTION_LENGTH: 2200,
    STORIES_PER_PAGE: 20,
  },
};

// ✅ Log konfigurasi saat development
if (process.env.NODE_ENV !== "production") {
  console.log("🔧 Configuration loaded:", {
    NODE_ENV: process.env.NODE_ENV,
    BASE_URL: CONFIG.BASE_URL || "(using proxy)",
    APP_VERSION: CONFIG.APP_VERSION,
  });
}

export default CONFIG;
