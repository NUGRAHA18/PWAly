// src/scripts/pages/home/home-page.js (VERSI LENGKAP DIPERBARUI)

import authGuard from "../../utils/auth-guard";
import HomePresenter from "../../presenters/home-presenter";
import StoryList from "../../components/story-list";
import StoryListSkeleton from "../../components/story-list-skeleton";
import MapHandler from "../../utils/map-handler";
import DatabaseHelper from "../../utils/database-helper";
import NotificationHelper from "../../utils/notification-helper";
import LoadingSpinner from "../../components/loading-spinner";
import AnimationObserver from "../../utils/animation-observer";

export default class HomePage {
  constructor() {
    this.presenter = new HomePresenter(this);
    this.mapHandler = null;
    this.stories = []; // ✅ [BARU] Master list dari API
    this.renderedStories = []; // ✅ [BARU] List yang sudah difilter/sort
    this._animationObserver = new AnimationObserver({
      rootMargin: "0px 0px -100px 0px",
      threshold: 0.1,
      triggerOnce: true,
    });
    this._scrollListener = null;
    this._isLoading = false;
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

    // Setup listener UI DULU
    document.getElementById("refresh-button").addEventListener("click", () => {
      this._loadStories();
    });
    document.getElementById("search-story").addEventListener("input", (e) => {
      // Gunakan debounce agar tidak lag saat mengetik
      this._debounce(this._updateDisplayedStories, 500)();
    });
    document.getElementById("sort-story").addEventListener("change", (e) => {
      this._updateDisplayedStories();
    });

    // Setup listener lainnya
    this._setupScrollListener();
    this._setupScrollAnimations();

    // Muat data awal
    await this._loadStories();
  }

  /**
   * ✅ [DIPERBARUI] Memuat SEMUA cerita dari presenter
   */
  async _loadStories() {
    if (this._isLoading) return;
    this._isLoading = true;
    this.showLoading(); // Tampilkan skeleton

    try {
      // Panggil presenter untuk mengambil (misal) 100 cerita terbaru
      // Kita asumsikan 100 adalah "semua" untuk filtering
      const result = await this.presenter.loadStories({
        page: 1,
        size: 100, // Ambil 100 cerita
        location: 1,
      });

      if (result.success) {
        this.stories = result.data || []; // Simpan ke master list
        this._updateDisplayedStories(); // Terapkan filter/sort default
      } else {
        this.showError(result.message);
      }
    } catch (error) {
      this.showError(error.message);
    } finally {
      this._isLoading = false;
      // hideLoading() tidak diperlukan, displayStories akan mengganti skeleton
    }
  }

  /**
   * ✅ [BARU] Fungsi pusat untuk filter, sort, dan re-render
   */
  _updateDisplayedStories() {
    // Ambil nilai saat ini dari UI
    const currentSearchTerm = (
      document.getElementById("search-story")?.value ?? ""
    ).toLowerCase();
    const currentSortValue =
      document.getElementById("sort-story")?.value ?? "newest";

    let storiesToRender = [...this.stories];

    // 1. Terapkan Filter (Search)
    if (currentSearchTerm) {
      storiesToRender = storiesToRender.filter(
        (story) =>
          story.description.toLowerCase().includes(currentSearchTerm) ||
          story.name.toLowerCase().includes(currentSearchTerm)
      );
    }

    // 2. Terapkan Sort
    if (currentSortValue === "oldest") {
      storiesToRender.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
    } else {
      // Default ke "newest"
      storiesToRender.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    this.renderedStories = storiesToRender;

    // 3. Re-render list dan map
    this.displayStories(this.renderedStories);
    this.displayMap(this.renderedStories);
  }

  showLoading() {
    const container = document.getElementById("stories-container");
    if (container) {
      container.innerHTML = StoryListSkeleton.render(6);
    }
  }

  hideLoading() {
    // Tidak perlu, displayStories akan mengganti skeleton
  }

  // displayStories (Merender list yang sudah difilter/sort)
  displayStories(stories) {
    const container = document.getElementById("stories-container");
    if (!container) return;

    container.innerHTML = StoryList.render(stories); // StoryList akan handle empty state
    this._setupAfterRenderBatch();
  }

  /**
   * ✅ [BARU] Fungsi helper untuk setup listeners setelah render
   */
  _setupAfterRenderBatch() {
    this._setupCardInteractionEvents();
    this._setupFavoriteButtonListeners();
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
        if (e.target.closest(".btn-favorite")) {
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

      card.addEventListener("focus", () => {
        card.style.outline = "2px solid var(--border-focus)";
        card.style.outlineOffset = "2px";
      });

      card.addEventListener("blur", () => {
        card.style.outline = "none";
      });
    });
  }

  _setupScrollListener() {
    const container = document.getElementById("home-page-container");
    const heroElement = document.querySelector(".home-hero");

    if (!container || !heroElement) {
      console.warn("⚠️ Container atau hero element tidak ditemukan");
      return;
    }

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

        // Ambil data cerita dari master list
        const storyData = this.stories.find((story) => story.id === storyId);
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

      button.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          button.click();
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

  /**
   * ✅ [BARU] Helper untuk debounce search input
   */
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
    console.log("🧹 Membersihkan HomePage...");

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

    // Hapus sisa listener
    const searchInput = document.getElementById("search-story");
    if (searchInput) searchInput.removeEventListener("input", this._debounce);

    const sortInput = document.getElementById("sort-story");
    if (sortInput)
      sortInput.removeEventListener("change", this._updateDisplayedStories);

    console.log("✅ HomePage berhasil dibersihkan");
  }
}
