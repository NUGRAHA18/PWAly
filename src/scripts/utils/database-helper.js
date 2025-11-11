import { openDB } from "idb";

const DB_NAME = "storyshare-database";
const DB_VERSION = 2; // <-- 1. NAIKKAN VERSI DARI 1 KE 2

// Definisikan nama-nama "tabel" (Object Store) kita
const FAVORITE_STORE_NAME = "stories-favorite";
const OUTBOX_STORE_NAME = "stories-outbox";

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(database, oldVersion, newVersion, transaction) {
    // 2. Modifikasi 'upgrade' agar lebih aman
    // Fungsi ini akan berjalan karena versi berubah dari 1 ke 2

    // Cek versi lama untuk menentukan apa yang harus dibuat
    // (Ini best practice jika Anda upgrade lagi di masa depan)

    // Buat 'stories-favorite' jika belum ada
    if (!database.objectStoreNames.contains(FAVORITE_STORE_NAME)) {
      database.createObjectStore(FAVORITE_STORE_NAME, { keyPath: "id" });
    }

    // Buat 'stories-outbox' jika belum ada (dari file lama Anda)
    if (!database.objectStoreNames.contains(OUTBOX_STORE_NAME)) {
      database.createObjectStore(OUTBOX_STORE_NAME, { keyPath: "id" });
    }
  },
});

const DatabaseHelper = {
  // --- Fungsi untuk OUTBOX (Offline Sync) ---
  async getAllOutboxStories() {
    return (await dbPromise).getAll(OUTBOX_STORE_NAME);
  },

  async putOutboxStory(story) {
    const storyWithId = story;
    if (!story.id) {
      storyWithId.id = new Date().toISOString();
    }
    return (await dbPromise).put(OUTBOX_STORE_NAME, storyWithId);
  },

  async deleteOutboxStory(id) {
    return (await dbPromise).delete(OUTBOX_STORE_NAME, id);
  },

  // --- Fungsi untuk FAVORIT (Kriteria 4 Basic) ---
  async getAllFavoriteStories() {
    // Fungsi ini sekarang akan berhasil
    return (await dbPromise).getAll(FAVORITE_STORE_NAME);
  },

  async getFavoriteStory(id) {
    return (await dbPromise).get(FAVORITE_STORE_NAME, id);
  },

  async putFavoriteStory(story) {
    if (!story || !story.id) {
      return;
    }
    return (await dbPromise).put(FAVORITE_STORE_NAME, story);
  },

  async deleteFavoriteStory(id) {
    return (await dbPromise).delete(FAVORITE_STORE_NAME, id);
  },
};

export default DatabaseHelper;
