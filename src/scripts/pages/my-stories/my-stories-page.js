// src/scripts/pages/my-stories/my-stories-page.js (FILE BARU)

import authGuard from "../../utils/auth-guard";
import storyModel from "../../models/story-model";
import StoryList from "../../components/story-list";
import StoryListSkeleton from "../../components/story-list-skeleton";
import NotificationHelper from "../../utils/notification-helper";
import DatabaseHelper from "../../utils/database-helper"; // Import untuk favorit

export default class MyStoriesPage {
  constructor() {
    this._stories = [];
    this._currentUser = authGuard.getCurrentUser();
  }

  async render() {
    if (!authGuard.requireAuth()) return "";

    return `
      <section class="container" id="my-stories-container"> 
        <div class="about-header">
          <h1>Ceritaku</h1>
          <p>Semua cerita yang Anda bagikan atas nama "${
            this._currentUser.name
          }"</p>
        </div>
        <div id="stories-container">
          ${StoryListSkeleton.render(3)}
        </div>
      </section>
    `;
  }

  async afterRender() {
    if (!authGuard.requireAuth()) return;

    const container = document.getElementById("stories-container");

    try {
      // 1. Ambil semua cerita (atau 100 cerita)
      const result = await storyModel.getStories({ size: 100 });

      if (result.success) {
        // 2. Filter berdasarkan nama pengguna yang login
        const allStories = result.data || [];
        const myName = this._currentUser.name;

        // Asumsi: API mengembalikan 'name' yang sama dengan nama user
        const myStories = allStories.filter((story) => story.name === myName);

        this._stories = myStories;

        // 3. Render list cerita
        container.innerHTML = StoryList.render(myStories);

        // 4. Setup listeners untuk kartu (favorit & klik)
        this._setupCardInteractionEvents(container);
        this._setupFavoriteButtonListeners(container);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Gagal memuat 'My Stories':", error);
      NotificationHelper.showError(error.message);
      container.innerHTML = `<div class="alert alert-error">❌ ${error.message}</div>`;
    }
  }

  // --- Helper listeners (dicopy dari home-page) ---

  _setupCardInteractionEvents(container) {
    const cards = container.querySelectorAll(".story-card");
    cards.forEach((card) => {
      const href = card.dataset.href;
      const handleCardClick = (e) => {
        if (e.target.closest(".btn-favorite")) return;
        if (href) window.location.hash = href;
      };
      card.addEventListener("click", handleCardClick);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick(e);
        }
      });
    });
  }

  async _setupFavoriteButtonListeners(container) {
    const favoriteStories = await DatabaseHelper.getAllFavoriteStories();
    const favoriteIds = favoriteStories.map((story) => story.id);
    const buttons = container.querySelectorAll(".btn-favorite");

    buttons.forEach((button) => {
      const storyId = button.dataset.storyId;
      if (favoriteIds.includes(storyId)) {
        button.classList.add("favorited");
        button.setAttribute(
          "aria-label",
          `Remove story ${storyId} from favorites`
        );
      } else {
        button.classList.remove("favorited");
        button.setAttribute("aria-label", `Save story ${storyId} to favorites`);
      }

      button.addEventListener("click", async (event) => {
        event.stopPropagation();
        event.preventDefault();
        const isFavorited = button.classList.contains("favorited");
        const storyData = this._stories.find((story) => story.id === storyId);

        if (!storyData) {
          NotificationHelper.showError("Gagal menemukan data cerita.");
          return;
        }

        if (isFavorited) {
          await DatabaseHelper.deleteFavoriteStory(storyId);
          button.classList.remove("favorited");
          button.setAttribute(
            "aria-label",
            `Save story ${storyId} to favorites`
          );
          NotificationHelper.showToast("Cerita dihapus dari favorit", "info");
        } else {
          await DatabaseHelper.putFavoriteStory(storyData);
          button.classList.add("favorited");
          button.setAttribute(
            "aria-label",
            `Remove story ${storyId} from favorites`
          );
          NotificationHelper.showToast("Cerita disimpan ke favorit");
        }
      });
    });
  }
}
