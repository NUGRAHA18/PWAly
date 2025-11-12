import authGuard from "../../utils/auth-guard";
import HomePresenter from "../../presenters/home-presenter";
import StoryList from "../../components/story-list";
import StoryListSkeleton from "../../components/story-list-skeleton";
import MapHandler from "../../utils/map-handler";
import DatabaseHelper from "../../utils/database-helper";
import NotificationHelper from "../../utils/notification-helper";
import AnimationObserver from "../../utils/animation-observer";
import Swal from "sweetalert2";

export default class HomePage {
  constructor() {
    this.presenter = new HomePresenter(this);
    this.mapHandler = null;
    this.stories = [];
    this.renderedStories = [];
    this._animationObserver = new AnimationObserver({
      rootMargin: "0px 0px -100px 0px",
      threshold: 0.1,
      triggerOnce: true,
    });
    this._scrollListener = null;
    this._isLoading = false;
    this._currentUser = authGuard.getCurrentUser();
  }

  async render() {
    if (!authGuard.requireAuth()) return "";
    const user = authGuard.getCurrentUser();

    return `
      <section class="container" id="home-page-container"> 
        <div class="home-hero">
          <h1>Selamat Datang, ${user?.name || "User"}!</h1>
          <p>Bagikan ceritamu dengan dunia</p>
        </div>

        <div class="stories-controls">
          <div class="search-sort-container">
            <input 
              type="search" 
              id="search-story" 
              class="form-input" 
              placeholder="Cari cerita berdasarkan nama atau deskripsi..."
              aria-label="Cari cerita"
            >
            <select id="sort-story" class="form-input" aria-label="Urutkan cerita">
              <option value="newest">Terbaru (Default)</option>
              <option value="oldest">Terlama</option>
            </select>
          </div>
          <button id="refresh-button" class="btn btn-secondary" title="Muat ulang cerita">
            🔄 Muat Ulang
          </button>
        </div>
        <div class="home-content">
          <div class="home-map"> 
            <div class="map-container">
              <div class="map-header">
                <h3 class="map-title">Peta Cerita</h3>
              </div>
              <div id="map"></div>
            </div>
          </div>

          <div class="home-stories"> 
            <div id="stories-container">
              ${StoryListSkeleton.render(6)}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    if (!authGuard.requireAuth()) return;

    this.mapHandler = new MapHandler("map");
    this.mapHandler.init();

    document.getElementById("refresh-button").addEventListener("click", () => {
      this._loadStories();
    });
    document.getElementById("search-story").addEventListener("input", () => {
      this._debounce(this._updateDisplayedStories, 500)();
    });
    document.getElementById("sort-story").addEventListener("change", () => {
      this._updateDisplayedStories();
    });

    this._setupScrollListener();
    this._setupScrollAnimations();

    await this._loadStories();
  }

  async _loadStories() {
    if (this._isLoading) return;
    this._isLoading = true;
    this.showLoading();

    try {
      const result = await this.presenter.loadStories({
        page: 1,
        size: 100,
        location: 1,
      });

      if (result.success) {
        // ✅ Filter hidden stories
        let stories = result.data || [];
        const hiddenStories = await DatabaseHelper.getAllHiddenStories();
        const hiddenIds = hiddenStories.map((h) => h.id);
        stories = stories.filter((story) => !hiddenIds.includes(story.id));

        this.stories = stories;
        this._updateDisplayedStories();
      } else {
        this.showError(result.message);
      }
    } catch (error) {
      this.showError(error.message);
    } finally {
      this._isLoading = false;
    }
  }

  _updateDisplayedStories() {
    const currentSearchTerm = (
      document.getElementById("search-story")?.value ?? ""
    ).toLowerCase();
    const currentSortValue =
      document.getElementById("sort-story")?.value ?? "newest";

    let storiesToRender = [...this.stories];

    if (currentSearchTerm) {
      storiesToRender = storiesToRender.filter(
        (story) =>
          story.description.toLowerCase().includes(currentSearchTerm) ||
          story.name.toLowerCase().includes(currentSearchTerm)
      );
    }

    if (currentSortValue === "oldest") {
      storiesToRender.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
    } else {
      storiesToRender.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    this.renderedStories = storiesToRender;

    this.displayStories(this.renderedStories);
    this.displayMap(this.renderedStories);
  }

  showLoading() {
    const container = document.getElementById("stories-container");
    if (container) {
      container.innerHTML = StoryListSkeleton.render(6);
    }
  }

  hideLoading() {}

  displayStories(stories) {
    const container = document.getElementById("stories-container");
    if (!container) return;

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

    this._setupAfterRenderBatch();
  }

  _setupAfterRenderBatch() {
    this._setupCardInteractionEvents();
    this._setupFavoriteButtonListeners();
    this._setupDeleteButtonListeners();
    setTimeout(() => {
      if (this._animationObserver) {
        this._animationObserver.observeAll(".story-card");
      }
    }, 100);
  }

  displayMap(stories) {
    if (!this.mapHandler) return;

    this.mapHandler.clearMarkers();
    const storiesWithLocation = stories.filter((s) => s.lat && s.lon);

    storiesWithLocation.forEach((story) => {
      const popupContent = `
        <div class="map-popup">
          <img src="${story.photoUrl}" alt="${
        story.description
      }" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;" />
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">${
            story.name
          }</h4>
          <p style="margin: 0; font-size: 12px; color: var(--text-secondary);">${story.description.substring(
            0,
            80
          )}...</p>
        </div>
      `;
      this.mapHandler.addMarker(story.lat, story.lon, popupContent, story.id);
    });

    if (storiesWithLocation.length > 0) {
      this.mapHandler.fitBounds();
    }
  }

  _setupCardInteractionEvents() {
    const container = document.getElementById("stories-container");
    if (!container) return;

    const cards = container.querySelectorAll(".story-card");

    cards.forEach((card) => {
      const storyId = card.dataset.storyId;
      const lat = card.dataset.lat;
      const lon = card.dataset.lon;
      const href = card.dataset.href;

      const handleCardClick = (e) => {
        if (
          e.target.closest(".btn-favorite") ||
          e.target.closest(".btn-delete")
        ) {
          return;
        }
        if (href) {
          window.location.hash = href;
        }
      };

      card.addEventListener("click", handleCardClick);

      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick(e);
        }
      });

      card.addEventListener("mouseenter", () => {
        if (this.mapHandler && storyId && lat && lon) {
          this.mapHandler.highlightMarker(storyId);
        }
      });
    });
  }

  _setupScrollListener() {
    const container = document.getElementById("home-page-container");
    const heroElement = document.querySelector(".home-hero");

    if (!container || !heroElement) return;

    const triggerHeight = heroElement.offsetHeight;

    this._scrollListener = () => {
      if (window.scrollY > triggerHeight) {
        container.classList.add("scrolled-layout");
      } else {
        container.classList.remove("scrolled-layout");
      }
    };

    window.addEventListener("scroll", this._scrollListener);
    this._scrollListener();
  }

  async _setupFavoriteButtonListeners() {
    const container = document.getElementById("stories-container");
    if (!container) return;

    const favoriteStories = await DatabaseHelper.getAllFavoriteStories();
    const favoriteIds = favoriteStories.map((story) => story.id);

    const buttons = container.querySelectorAll(".btn-favorite");

    buttons.forEach((button) => {
      const storyId = button.dataset.storyId;

      if (favoriteIds.includes(storyId)) {
        button.classList.add("favorited");
      } else {
        button.classList.remove("favorited");
      }

      button.addEventListener("click", async (event) => {
        event.stopPropagation();
        event.preventDefault();

        const isFavorited = button.classList.contains("favorited");

        const storyData = this.stories.find((story) => story.id === storyId);
        if (!storyData) return;

        if (isFavorited) {
          await DatabaseHelper.deleteFavoriteStory(storyId);
          button.classList.remove("favorited");
          NotificationHelper.showToast("Cerita dihapus dari favorit", "info");
        } else {
          await DatabaseHelper.putFavoriteStory(storyData);
          button.classList.add("favorited");
          NotificationHelper.showToast("Cerita disimpan ke favorit");
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
    });
  }

  showError(message) {
    const container = document.getElementById("stories-container");
    if (container) {
      container.innerHTML = `
        <div class="alert alert-error">
          ❌ ${message}
        </div>
      `;
    }
  }

  _setupScrollAnimations() {
    const elementsToAnimate = [".home-hero", ".home-map", ".stories-controls"];
    setTimeout(() => {
      if (this._animationObserver) {
        elementsToAnimate.forEach((selector) => {
          this._animationObserver.observeAll(selector);
        });
      }
    }, 50);
  }

  _debounce(func, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  async destroy() {
    if (this._scrollListener) {
      window.removeEventListener("scroll", this._scrollListener);
      this._scrollListener = null;
    }
    if (this.mapHandler) {
      this.mapHandler.destroy();
      this.mapHandler = null;
    }
    if (this._animationObserver) {
      this._animationObserver.disconnect();
      this._animationObserver = null;
    }
  }
}
