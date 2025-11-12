import StoryDetailPresenter from "../../presenters/story-detail-presenter";
import { parseActivePathname } from "../../routes/url-parser";
import LoadingSpinner from "../../components/loading-spinner";
import { showFormattedDate } from "../../utils";
import authGuard from "../../utils/auth-guard";
import MapHandler from "../../utils/map-handler"; // <-- [1] IMPORT BARU
import DatabaseHelper from "../../utils/database-helper";
import NotificationHelper from "../../utils/notification-helper";

export default class StoryDetailPage {
  constructor() {
    this.presenter = new StoryDetailPresenter(this);
    this.container = null;
    this._mapHandler = null; // <-- [2] PROPERTI BARU
    this._storyData = null;
  }

  async render() {
    if (!authGuard.requireAuth()) return "";

    // Tampilkan loading spinner saat data sedang diambil
    return `
      <section class="container" id="story-detail-container">
        ${LoadingSpinner.render()}
      </section>
    `;
  }

  async afterRender() {
    if (!authGuard.requireAuth()) return;

    this.container = document.getElementById("story-detail-container");

    // Ambil ID dari URL
    const { id } = parseActivePathname();

    // Minta presenter untuk mengambil data
    if (id) {
      await this.presenter.loadStory(id);
    } else {
      this.showError("ID Cerita tidak ditemukan.");
    }
  }

  showLoading() {
    if (this.container) {
      this.container.innerHTML = LoadingSpinner.render();
    }
    NotificationHelper.showLoading();
  }

  showError(message) {
    if (this.container) {
      this.container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">😢</div>
          <h3 class="empty-state-title">Gagal Memuat Cerita</h3>
          <p class="empty-state-description">${message}</p>
          <a href="#/" class="btn btn-primary">Kembali ke Home</a>
        </div>
      `;
    }
  }

  hideLoading() {
    NotificationHelper.hideLoading();
  }

  /**
   * Me-render HTML untuk detail cerita dan peta
   */
  displayStory(story) {
    if (!this.container) return;
    this._storyData = story;
    const hasLocation = story.lat && story.lon;

    // [3.a] Bersihkan instance map lama sebelum render ulang

    if (this._mapHandler) {
      this._mapHandler.destroy();
      this._mapHandler = null;
    }

    this.container.innerHTML = `
      <div class="story-detail-actions mb-lg">
        <a href="#/" class="btn btn-secondary">← Kembali ke Home</a>
      </div>
      <article class="story-detail">
        <header class="story-detail-header">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
             <div>
                <h1 class="story-detail-author">${story.name}</h1>
                <p class="story-detail-date">${showFormattedDate(
                  story.createdAt
                )}</p>
             </div>
             <button 
                id="favorite-toggle-button" 
                class="btn-favorite btn-lg" 
                data-story-id="${story.id}"
                aria-label="Toggle favorite status"
             >
                </button>
             </div>
        </header>
        
        <div class="story-detail-media">
          <img 
            src="${story.photoUrl}" 
            alt="Foto cerita oleh ${story.name}" 
            class="story-detail-image"
          />
        </div>

        <div class="story-detail-content">
          <p class="story-detail-description">${story.description}</p>
          ${
            hasLocation
              ? `<div class="story-detail-location mb-md">
                  📍 ${parseFloat(story.lat).toFixed(4)}, ${parseFloat(
                  story.lon
                ).toFixed(4)}
                </div>
                <div class="map-container card">
                  <div class="map-header">
                    <h3 class="map-title">Lokasi Cerita</h3>
                  </div>
                  <div id="story-map" style="height: 300px;"></div> 
                </div>
                `
              : ""
          }
        </div>
      </article>
    `;
    setTimeout(() => {
      this._setupStoryMap(story);
      this._setupFavoriteButtonListener(story);
    }, 0);
  }

  _setupStoryMap(story) {
    const hasLocation = story.lat && story.lon;
    if (hasLocation) {
      this._mapHandler = new MapHandler("story-map");
      const map = this._mapHandler.init();
      const lat = story.lat;
      const lon = story.lon;

      this._mapHandler.addMarker(lat, lon, `Lokasi ${story.name}`);
      map.setView([lat, lon], 13);
    }
  }

  async _setupFavoriteButtonListener(story) {
    const button = document.getElementById("favorite-toggle-button");
    if (!button) return;

    const storyId = story.id;
    let isFavorited = await DatabaseHelper.getFavoriteStory(storyId);

    const updateButtonUI = (isFav) => {
      const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${
        isFav ? "currentColor" : "none"
      }" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-bookmark"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;
      button.innerHTML = svgIcon;
      button.classList.toggle("favorited", isFav);
      button.setAttribute(
        "aria-label",
        isFav ? "Hapus dari favorit" : "Simpan ke favorit"
      );
      button.setAttribute(
        "title",
        isFav ? "Hapus dari favorit" : "Simpan ke favorit"
      );
    };

    updateButtonUI(!!isFavorited);

    button.addEventListener("click", async () => {
      try {
        if (isFavorited) {
          await DatabaseHelper.deleteFavoriteStory(storyId);
          NotificationHelper.showToast("Cerita dihapus dari favorit", "info");
          isFavorited = false;
        } else {
          await DatabaseHelper.putFavoriteStory(story);
          NotificationHelper.showToast("Cerita disimpan ke favorit", "success");
          isFavorited = true;
        }
        updateButtonUI(isFavorited);
      } catch (error) {
        console.error("Failed to toggle favorite:", error);
        NotificationHelper.showError("Gagal memproses permintaan favorit.");
      }
    });
  }

  // [4] METODE UNTUK MEMBERSIHKAN MAP SAAT HALAMAN DIGANTI
  async destroy() {
    if (this._mapHandler) {
      this._mapHandler.destroy();
      this._mapHandler = null;
      console.log("✅ StoryDetailPage map cleaned up.");
    }
  }
}
