import { openDB } from "idb";
import CONFIG from "../config";

const DB_NAME = "storyshare-database";
const DB_VERSION = 1;
const OBJECT_STORE_NAME = "stories-outbox";

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(database) {
    // Buat "tabel" (object store) untuk menampung cerita yang akan disinkronkan
    database.createObjectStore(OBJECT_STORE_NAME, { keyPath: "id" });
  },
});

const DatabaseHelper = {
  /**
   * Mengambil semua cerita dari outbox IndexedDB.
   */
  async getAllStories() {
    return (await dbPromise).getAll(OBJECT_STORE_NAME);
  },

  /**
   * Menambahkan satu cerita ke outbox IndexedDB.
   * (Kriteria 4: Create)
   */
  async putStory(story) {
    // Kita butuh ID unik untuk keyPath
    // Kita akan gunakan timestamp sebagai ID sementara
    const storyWithId = story;
    if (!story.id) {
      storyWithId.id = new Date().toISOString();
    }
    return (await dbPromise).put(OBJECT_STORE_NAME, storyWithId);
  },

  /**
   * Menghapus satu cerita dari outbox IndexedDB berdasarkan ID.
   * (Kriteria 4: Delete)
   */
  async deleteStory(id) {
    return (await dbPromise).delete(OBJECT_STORE_NAME, id);
  },
};

export default DatabaseHelper;
