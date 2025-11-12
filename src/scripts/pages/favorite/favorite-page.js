// --- SEMUA PATH DI BAWAH INI SUDAH DIPERBAIKI (../../) ---
import DatabaseHelper from "../../utils/database-helper";
import StoryList from "../../components/story-list";
import authGuard from "../../utils/auth-guard";
import StoryListSkeleton from "../../components/story-list-skeleton";
import NotificationHelper from "../../utils/notification-helper";

export default class FavoritePage {
  constructor() {
    this._stories = [];
  }

  async render() {
    return `
      <section class="container" id="favorite-page-container"> 
        <div class="about-header"> <h1>Cerita Favorit</h1>
          <p>Cerita yang Anda simpan untuk dibaca kembali.</p>
        </div>
        
        <div class="stories-controls"> <div class="search-sort-container">
            <input 
              type="search" 
              id="search-favorite" 
              class="form-input" 
              placeholder="Cari di dalam favorit..."
              aria-label="Cari cerita favorit"
            >
          </div>
        </div>

        <div id="stories-container">
          ${StoryListSkeleton.render(3)}
        </div>
      </section>
    `;
  }

  async afterRender() {
    if (!authGuard.isAuthenticated()) return;
    await this._loadFavoriteStories();
    const searchInput = document.getElementById("search-favorite");
    if (searchInput) {
      searchInput.addEventListener("input", (event) => {
        this._performSearch(event.target.value || "");
      });
    }
  }

  async _loadFavoriteStories() {
    try {
      const stories = await DatabaseHelper.getAllFavoriteStories();
      this._stories = Array.isArray(stories) ? stories : [];
      this._stories.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      this._renderStories(this._stories);
    } catch (err) {
      console.error("Gagal memuat cerita favorit:", err);
      NotificationHelper.showToast("Gagal memuat cerita favorit", "error");
      this._stories = [];
      this._renderStories([]);
    }
  }

  _performSearch(keyword = "") {
    const lowerKeyword = String(keyword).toLowerCase();
    const filteredStories = this._stories.filter((story) => {
      const name = (story.name || "").toLowerCase();
      const desc = (story.description || "").toLowerCase();
      return name.includes(lowerKeyword) || desc.includes(lowerKeyword);
    });
    this._renderStories(filteredStories);
    this._setupFavoriteButtonListeners();
  }

  _renderStories(stories) {
    const container = document.getElementById("stories-container");
    if (!container) return;

    if (Array.isArray(stories) && stories.length > 0) {
      container.innerHTML = StoryList.render(stories);
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💔</div>
          <h3 class="empty-state-title">Belum Ada Favorit</h3>
          <p class="empty-state-description">
            Anda belum menyimpan cerita apapun.
          </p>
          <a href="#/" class="btn btn-primary">Cari Cerita</a>
        </div>
      `;
    }
    this._setupFavoriteButtonListeners();
  }

  async _setupFavoriteButtonListeners() {
    const container = document.getElementById("stories-container");
    if (!container) return;

    const buttons = container.querySelectorAll(".btn-favorite");
    buttons.forEach((button) => {
      button.classList.add("favorited");
      button.setAttribute("aria-label", "Hapus cerita dari favorit");

      button.addEventListener("click", async (event) => {
        event.stopPropagation();
        const btn = event.currentTarget;
        const storyId = btn.dataset.storyId;

        if (!storyId) {
          console.warn("storyId tidak ditemukan pada tombol favorit");
          return;
        }

        try {
          await DatabaseHelper.deleteFavoriteStory(storyId);
          NotificationHelper.showToast("Cerita dihapus dari favorit", "info");

          await this._loadFavoriteStories();
        } catch (err) {
          console.error("Gagal menghapus favorit:", err);
          NotificationHelper.showToast("Gagal menghapus favorit", "error");
        }
      });
    });
  }
}
