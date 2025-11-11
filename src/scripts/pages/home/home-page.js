// src/scripts/pages/home/home-page.js
// ✅ UPDATE: Menambahkan click handler untuk navigasi story card

import authGuard from "../../utils/auth-guard";
import HomePresenter from "../../presenters/home-presenter";
import StoryList from "../../components/story-list";
import StoryListSkeleton from "../../components/story-list-skeleton";
import MapHandler from "../../utils/map-handler";
import DatabaseHelper from "../../utils/database-helper";
import NotificationHelper from "../../utils/notification-helper";
import LoadingSpinner from "../../components/loading-spinner";

export default class HomePage {
  constructor() {
    this.presenter = new HomePresenter(this);
    this.mapHandler = null;
    this.stories = [];
    this._scrollListener = null;
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
          <!-- Tempat untuk filter/sort jika diperlukan -->
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
              ${LoadingSpinner.render()}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    if (!authGuard.requireAuth()) return;

    // 1. Inisialisasi map
    this.mapHandler = new MapHandler("map");
    this.mapHandler.init();

    // 2. Load stories
    await this.presenter.loadStories({ location: 1 });

    // 3. Setup semua event listeners
    this._setupCardInteractionEvents();
    this._setupFavoriteButtonListeners();
    this._setupScrollListener();
  }

  showLoading() {
    const container = document.getElementById("stories-container");
    if (container) {
      container.innerHTML = StoryListSkeleton.render(6);
    }
  }

  hideLoading() {
    // Loading akan diganti dengan stories
  }

  displayStories(stories) {
    this.stories = stories;

    const container = document.getElementById("stories-container");
    if (container) {
      container.innerHTML = StoryList.render(stories);
    }

    const countElement = document.getElementById("stories-count");
    if (countElement) {
      countElement.textContent = `(${stories.length} cerita)`;
    }

    // Setup ulang interaksi setelah story dirender
    this._setupCardInteractionEvents();
    this._setupFavoriteButtonListeners();
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

  /**
   * ✅ UPDATE: Menambahkan click handler untuk navigasi
   */
  _setupCardInteractionEvents() {
    const container = document.getElementById("stories-container");
    if (!container) return;

    const cards = container.querySelectorAll(".story-card");

    cards.forEach((card) => {
      const storyId = card.dataset.storyId;
      const lat = card.dataset.lat;
      const lon = card.dataset.lon;
      const href = card.dataset.href;

      // ✅ TAMBAHAN: Click handler untuk navigasi
      const handleCardClick = (e) => {
        // Jangan navigate jika yang diklik adalah tombol favorite atau child-nya
        if (e.target.closest(".btn-favorite")) {
          return; // Biarkan event favorite berjalan
        }

        // Navigate ke detail page
        if (href) {
          window.location.hash = href;
        }
      };

      // Event listener untuk mouse click
      card.addEventListener("click", handleCardClick);

      // ✅ TAMBAHAN: Keyboard navigation (Enter/Space)
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick(e);
        }
      });

      // Highlight marker saat hover
      card.addEventListener("mouseenter", () => {
        if (this.mapHandler && storyId && lat && lon) {
          this.mapHandler.highlightMarker(storyId);
        }
      });

      // ✅ TAMBAHAN: Visual feedback saat focus (accessibility)
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

    console.log("✅ Scroll listener terpasang");
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

      // ✅ Click handler untuk favorite (dengan stopPropagation)
      button.addEventListener("click", async (event) => {
        event.stopPropagation(); // ✅ PENTING: Hentikan bubbling ke card
        event.preventDefault();

        const isFavorited = button.classList.contains("favorited");

        if (isFavorited) {
          await DatabaseHelper.deleteFavoriteStory(storyId);
          button.classList.remove("favorited");
          button.setAttribute(
            "aria-label",
            `Save story ${storyId} to favorites`
          );
          NotificationHelper.showToast("Cerita dihapus dari favorit", "info");
        } else {
          const storyData = this.stories.find((story) => story.id === storyId);
          if (storyData) {
            await DatabaseHelper.putFavoriteStory(storyData);
            button.classList.add("favorited");
            button.setAttribute(
              "aria-label",
              `Remove story ${storyId} from favorites`
            );
            NotificationHelper.showToast("Cerita disimpan ke favorit");
          } else {
            NotificationHelper.showError(
              "Gagal menemukan data cerita untuk disimpan."
            );
          }
        }
      });

      // ✅ TAMBAHAN: Keyboard handler untuk favorite button
      button.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation(); // Jangan trigger card navigation
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

  async destroy() {
    console.log("🧹 Membersihkan HomePage...");

    if (this._scrollListener) {
      window.removeEventListener("scroll", this._scrollListener);
      this._scrollListener = null;
      console.log("✅ Scroll listener dihapus");
    }

    if (this.mapHandler) {
      this.mapHandler.destroy();
      this.mapHandler = null;
      console.log("✅ Map handler dihapus");
    }

    console.log("✅ HomePage berhasil dibersihkan");
  }
}
