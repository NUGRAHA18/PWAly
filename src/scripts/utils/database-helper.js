import { openDB } from "idb";

const DB_NAME = "storyshare-database";
const DB_VERSION = 2;

const STORE_NAMES = {
  FAVORITE: "stories-favorite",
  OUTBOX: "stories-outbox",
};

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAMES.FAVORITE)) {
      db.createObjectStore(STORE_NAMES.FAVORITE, { keyPath: "id" });
    }
    if (!db.objectStoreNames.contains(STORE_NAMES.OUTBOX)) {
      db.createObjectStore(STORE_NAMES.OUTBOX, { keyPath: "id" });
    }
  },
});

const DatabaseHelper = {
  async getAllOutboxStories() {
    return (await dbPromise).getAll(STORE_NAMES.OUTBOX);
  },

  async putOutboxStory(story) {
    if (!story) return;
    const storyWithId = { ...story, id: story.id || new Date().toISOString() };
    return (await dbPromise).put(STORE_NAMES.OUTBOX, storyWithId);
  },

  async deleteOutboxStory(id) {
    if (!id) return;
    return (await dbPromise).delete(STORE_NAMES.OUTBOX, id);
  },

  async getAllFavoriteStories() {
    return (await dbPromise).getAll(STORE_NAMES.FAVORITE);
  },

  async getFavoriteStory(id) {
    if (!id) return;
    return (await dbPromise).get(STORE_NAMES.FAVORITE, id);
  },

  async putFavoriteStory(story) {
    if (!story?.id) return;
    return (await dbPromise).put(STORE_NAMES.FAVORITE, story);
  },

  async deleteFavoriteStory(id) {
    if (!id) return;
    return (await dbPromise).delete(STORE_NAMES.FAVORITE, id);
  },
};

export default DatabaseHelper;
