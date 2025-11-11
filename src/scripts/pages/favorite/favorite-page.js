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
    if (!authGuard.requireAuth()) return "";

    return `
      <section class="container" id="favorite-page-container"> 
        <div id="stories-container">
          ${StoryListSkeleton.render(6)}
        </div>

        <!-- optional: input search -->
        <div class="search-wrapper">
          <input id="search-favorite" placeholder="Cari favorit..." />
        </div>
      </section>
    `;
  }

  async afterRender() {
    if (!authGuard.requireAuth()) return;

    // Ambil data dari IndexedDB
    await this._loadFavoriteStories();

    // Kriteria 4 (Skilled): Tambahkan event listener untuk search (cek null)
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
      this._renderStories(this._stories);
      this._setupFavoriteButtonListeners(); // Panggil listener setelah render
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
    this._setupFavoriteButtonListeners(); // Panggil listener setelah render (filter)
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
  }

  /**
   * Mengatur event listener untuk tombol favorit di Halaman Favorit.
   * Ini HANYA untuk DELETE.
   */
  async _setupFavoriteButtonListeners() {
    const container = document.getElementById("stories-container");
    if (!container) return;

    const buttons = container.querySelectorAll(".btn-favorite");
    buttons.forEach((button) => {
      // Tandai semua sebagai sudah difavoritkan
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
          // --- LOGIKA DELETE ---
          await DatabaseHelper.deleteFavoriteStory(storyId);
          NotificationHelper.showToast("Cerita dihapus dari favorit", "info");

          // Muat ulang daftar cerita setelah dihapus (tunggu sampai selesai)
          await this._loadFavoriteStories();
        } catch (err) {
          console.error("Gagal menghapus favorit:", err);
          NotificationHelper.showToast("Gagal menghapus favorit", "error");
        }
      });
    });
  }
}
