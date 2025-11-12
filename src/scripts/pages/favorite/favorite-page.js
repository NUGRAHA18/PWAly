import DatabaseHelper from "../../utils/database-helper";
import StoryList from "../../components/story-list";
import authGuard from "../../utils/auth-guard";
import StoryListSkeleton from "../../components/story-list-skeleton";
import NotificationHelper from "../../utils/notification-helper";
import Swal from "sweetalert2";

export default class FavoritePage {
  constructor() {
    this._stories = [];
    this._currentUser = authGuard.getCurrentUser();
  }

  async render() {
    return `
      <section class="container" id="favorite-page-container"> 
        <div class="about-header">
          <h1>Cerita Favorit</h1>
          <p>Cerita yang Anda simpan untuk dibaca kembali.</p>
        </div>
        
        <div class="stories-controls">
          <div class="search-sort-container">
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
      let stories = await DatabaseHelper.getAllFavoriteStories();

      // ✅ Filter hidden stories
      const hiddenStories = await DatabaseHelper.getAllHiddenStories();
      const hiddenIds = hiddenStories.map((h) => h.id);
      stories = stories.filter((story) => !hiddenIds.includes(story.id));

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
  }

  _renderStories(stories) {
    const container = document.getElementById("stories-container");
    if (!container) return;

    if (Array.isArray(stories) && stories.length > 0) {
      container.innerHTML = StoryList.render(stories);

      // Inject delete button untuk story milik user
      stories.forEach((story) => {
        if (story.name === this._currentUser?.name) {
          const card = container.querySelector(`[data-story-id="${story.id}"]`);
          if (card) {
            const actionsDiv = card.querySelector(".story-card-actions");
            if (actionsDiv && !actionsDiv.querySelector(".btn-delete")) {
              actionsDiv.insertAdjacentHTML(
                "beforeend",
                `
                <button 
                  class="btn-delete" 
                  aria-label="Hapus cerita" 
                  title="Hapus cerita"
                  data-story-id="${story.id}"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              `
              );
            }
          }
        }
      });
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

    this._setupCardInteractionEvents();
    this._setupFavoriteButtonListeners();
    this._setupDeleteButtonListeners();
  }

  _setupCardInteractionEvents() {
    const container = document.getElementById("stories-container");
    if (!container) return;

    const cards = container.querySelectorAll(".story-card");

    cards.forEach((card) => {
      const href = card.dataset.href;

      const handleCardClick = (e) => {
        if (
          e.target.closest(".btn-favorite") ||
          e.target.closest(".btn-delete")
        ) {
          return;
        }
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

  async _setupFavoriteButtonListeners() {
    const container = document.getElementById("stories-container");
    if (!container) return;

    const buttons = container.querySelectorAll(".btn-favorite");
    buttons.forEach((button) => {
      button.classList.add("favorited");
      button.setAttribute("aria-label", "Hapus cerita dari favorit");

      button.addEventListener("click", async (event) => {
        event.stopPropagation();
        const storyId = event.currentTarget.dataset.storyId;

        if (!storyId) return;

        try {
          await DatabaseHelper.deleteFavoriteStory(storyId);
          NotificationHelper.showToast("Cerita dihapus dari favorit", "info");
          await this._loadFavoriteStories();
        } catch (err) {
          NotificationHelper.showToast("Gagal menghapus favorit", "error");
        }
      });
    });
  }

  _setupDeleteButtonListeners() {
    const container = document.getElementById("stories-container");
    if (!container) return;

    const buttons = container.querySelectorAll(".btn-delete");

    buttons.forEach((button) => {
      button.addEventListener("click", async (event) => {
        event.stopPropagation();
        event.preventDefault();

        const storyId = button.dataset.storyId;

        const result = await Swal.fire({
          title: "Sembunyikan Cerita?",
          text: "Cerita akan disembunyikan dari semua daftar Anda",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#3085d6",
          confirmButtonText: "Ya, Sembunyikan!",
          cancelButtonText: "Batal",
        });

        if (result.isConfirmed) {
          try {
            // ✅ Hide story
            await DatabaseHelper.hideStory(storyId);
            await DatabaseHelper.deleteFavoriteStory(storyId);

            NotificationHelper.showToast(
              "Cerita berhasil disembunyikan",
              "success"
            );

            await this._loadFavoriteStories();
          } catch (error) {
            NotificationHelper.showError("Gagal menyembunyikan cerita");
          }
        }
      });

      button.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          button.click();
        }
      });
    });
  }
}
