// --- SEMUA PATH DI BAWAH INI SUDAH DIPERBAIKI (../../) ---
import DatabaseHelper from "../../utils/database-helper";
import StoryList from "../../components/story-list";
import LoadingSpinner from "../../components/loading-spinner";
import authGuard from "../../utils/auth-guard";
import NotificationHelper from "../../utils/notification-helper";

export default class FavoritePage {
  constructor() {
    this._stories = [];
  }

  async render() {
    if (!authGuard.requireAuth()) return "";

    return `
      <section class="container" id="favorite-page-container"> 
        <div class="home-hero">
          <h1>Cerita Favorit Anda</h1>
          <p>Cerita yang Anda simpan akan muncul di sini.</p>
        </div>

        <div class="stories-controls mb-xl">
          <div class="form-group" style="width: 100%;">
            <label for="search-favorite" class="form-label">Cari Favorit</label>
            <input
              type="search"
              id="search-favorite"
              class="form-input"
              placeholder="Cari berdasarkan nama atau deskripsi..."
            />
          </div>
        </div>

        <div id="stories-container">
          ${LoadingSpinner.render()}
        </div>
      </section>
    `;
  }

  async afterRender() {
    if (!authGuard.requireAuth()) return;

    // Ambil data dari IndexedDB
    await this._loadFavoriteStories();

    // Kriteria 4 (Skilled): Tambahkan event listener untuk search
    const searchInput = document.getElementById("search-favorite");
    searchInput.addEventListener("input", (event) => {
      this._performSearch(event.target.value);
    });
  }

  async _loadFavoriteStories() {
    const stories = await DatabaseHelper.getAllFavoriteStories();
    this._stories = stories;
    this._renderStories(stories);
    this._setupFavoriteButtonListeners(); // Panggil listener setelah render
  }

  _performSearch(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    const filteredStories = this._stories.filter(
      (story) =>
        story.name.toLowerCase().includes(lowerKeyword) ||
        story.description.toLowerCase().includes(lowerKeyword)
    );
    this._renderStories(filteredStories);
    this._setupFavoriteButtonListeners(); // Panggil listener setelah render (filter)
  }

  _renderStories(stories) {
    const container = document.getElementById("stories-container");
    if (stories.length > 0) {
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
      button.setAttribute("aria-label", `Hapus cerita dari favorit`);

      button.addEventListener("click", async (event) => {
        event.stopPropagation();

        const storyId = button.dataset.storyId;

        // --- LOGIKA DELETE ---
        await DatabaseHelper.deleteFavoriteStory(storyId);
        NotificationHelper.showSuccess("Cerita dihapus dari favorit");

        // Muat ulang daftar cerita setelah dihapus
        this._loadFavoriteStories();
      });
    });
  }
}
