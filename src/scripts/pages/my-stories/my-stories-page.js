import authGuard from "../../utils/auth-guard";
import storyModel from "../../models/story-model";
import StoryList from "../../components/story-list";
import StoryListSkeleton from "../../components/story-list-skeleton";
import NotificationHelper from "../../utils/notification-helper";
import DatabaseHelper from "../../utils/database-helper";
import Swal from "sweetalert2";

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
            this._currentUser?.name || "User"
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
    await this._loadStories();
  }

  async _loadStories() {
    const container = document.getElementById("stories-container");

    try {
      const result = await storyModel.getStories({ size: 100 });

      if (result.success) {
        const allStories = result.data || [];
        const myName = this._currentUser?.name;

        if (!myName) {
          throw new Error("User name tidak ditemukan. Silakan login ulang.");
        }

        // Filter by user name
        let myStories = allStories.filter((story) => story.name === myName);

        // ✅ Filter hidden stories
        const hiddenStories = await DatabaseHelper.getAllHiddenStories();
        const hiddenIds = hiddenStories.map((h) => h.id);
        myStories = myStories.filter((story) => !hiddenIds.includes(story.id));

        this._stories = myStories;

        container.innerHTML = StoryList.render(myStories);

        // Inject delete button
        myStories.forEach((story) => {
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
        });

        setTimeout(() => {
          this._setupCardInteractionEvents();
          this._setupFavoriteButtonListeners();
          this._setupDeleteButtonListeners();
        }, 0);
      } else {
        throw new Error(result.message || "Gagal memuat cerita");
      }
    } catch (error) {
      console.error("Gagal memuat 'My Stories':", error);
      NotificationHelper.showError(error.message);
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">😢</div>
          <h3 class="empty-state-title">Gagal Memuat Cerita</h3>
          <p class="empty-state-description">${error.message}</p>
          <a href="#/" class="btn btn-primary">Kembali ke Home</a>
        </div>
      `;
    }
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

      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
    });
  }

  async _setupFavoriteButtonListeners() {
    const container = document.getElementById("stories-container");
    if (!container) return;

    const favoriteStories = await DatabaseHelper.getAllFavoriteStories();
    const favoriteIds = favoriteStories.map((story) => story.id);
    const buttons = container.querySelectorAll(".btn-favorite");

    buttons.forEach((button) => {
      const storyId = button.dataset.storyId;
      if (!storyId) return;

      if (favoriteIds.includes(storyId)) {
        button.classList.add("favorited");
        button.setAttribute("aria-label", `Hapus cerita dari favorit`);
      } else {
        button.classList.remove("favorited");
        button.setAttribute("aria-label", `Simpan cerita ke favorit`);
      }

      const handleFavoriteToggle = async (event) => {
        event.stopPropagation();
        event.preventDefault();

        const isFavorited = button.classList.contains("favorited");
        const storyData = this._stories.find((story) => story.id === storyId);

        if (!storyData) {
          NotificationHelper.showError("Gagal menemukan data cerita.");
          return;
        }

        try {
          if (isFavorited) {
            await DatabaseHelper.deleteFavoriteStory(storyId);
            button.classList.remove("favorited");
            button.setAttribute("aria-label", `Simpan cerita ke favorit`);
            NotificationHelper.showToast("Cerita dihapus dari favorit", "info");
          } else {
            await DatabaseHelper.putFavoriteStory(storyData);
            button.classList.add("favorited");
            button.setAttribute("aria-label", `Hapus cerita dari favorit`);
            NotificationHelper.showToast(
              "Cerita disimpan ke favorit",
              "success"
            );
          }
        } catch (error) {
          NotificationHelper.showError("Gagal memproses favorit.");
        }
      };

      button.addEventListener("click", handleFavoriteToggle);
      button.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          handleFavoriteToggle(e);
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
          text: "Cerita akan disembunyikan dari daftar Anda (hanya di perangkat ini)",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#3085d6",
          confirmButtonText: "Ya, Sembunyikan!",
          cancelButtonText: "Batal",
        });

        if (result.isConfirmed) {
          try {
            // ✅ Hide story (client-side)
            await DatabaseHelper.hideStory(storyId);
            await DatabaseHelper.deleteFavoriteStory(storyId);

            NotificationHelper.showToast(
              "Cerita berhasil disembunyikan",
              "success"
            );

            await this._loadStories();
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
