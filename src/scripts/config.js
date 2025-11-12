// src/scripts/config.js

const CONFIG = {
  BASE_URL:
    process.env.NODE_ENV === "production"
      ? "https://story-api.dicoding.dev"
      : "",

  DEFAULT_LANGUAGE: "en-US",

  PUSH_NOTIFICATION_VAPID_PUBLIC_KEY:
    "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk",

  APP_NAME: "StoryShare",
  APP_VERSION: "1.0.0",

  CACHE_DURATION: {
    IMAGES: 30 * 24 * 60 * 60,
    API: 24 * 60 * 60,
    STATIC: 7 * 24 * 60 * 60,
  },

  ENDPOINTS: {
    REGISTER: "/register",
    LOGIN: "/v1/login",
    STORIES: "/v1/stories",
    STORY_DETAIL: (id) => `/v1/stories/${id}`,
  },

  FEATURES: {
    ENABLE_NOTIFICATIONS: true,
    ENABLE_OFFLINE_MODE: true,
    ENABLE_BACKGROUND_SYNC: true,
    ENABLE_MAP: true,
    ENABLE_CAMERA: true,
  },

  LIMITS: {
    MAX_PHOTO_SIZE: 1 * 1024 * 1024,
    MAX_DESCRIPTION_LENGTH: 2200,
    STORIES_PER_PAGE: 20,
  },
};

if (process.env.NODE_ENV !== "production") {
  console.log("🔧 Configuration loaded:", {
    NODE_ENV: process.env.NODE_ENV,
    BASE_URL: CONFIG.BASE_URL || "(using proxy)",
    APP_VERSION: CONFIG.APP_VERSION,
  });
}

export default CONFIG;
