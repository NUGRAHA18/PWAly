import authGuard from "../../utils/auth-guard";
import HomePresenter from "../../presenters/home-presenter";
import StoryList from "../../components/story-list";
import StoryListSkeleton from "../../components/story-list-skeleton";
import MapHandler from "../../utils/map-handler";
import DatabaseHelper from "../../utils/database-helper";
import NotificationHelper from "../../utils/notification-helper";

export default class HomePage {
  constructor() {
    this.presenter = new HomePresenter(this);
    this.mapHandler = null;
    this.stories = [];
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

    this.mapHandler = new MapHandler("map");
    this.mapHandler.init();

    await this.presenter.loadStories({ location: 1 });

    // Panggil fungsi yang sudah diperbarui
    this._setupCardInteractionEvents();
    this._setupFavoriteButtonListeners();
    this._setupScrollListener();
  }

  showLoading() {
    const container = document.getElementById("stories-container");
    if (container) {
      container.innerHTML = StoryListSkeleton.render(6); // Tampilkan 6 skeleton
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
    this._setupCardInteractionEvents();
    this._setupFavoriteButtonListeners();

    const countElement = document.getElementById("stories-count");
    if (countElement) {
      countElement.textContent = `(${stories.length} cerita)`;
    }
    // Panggil ulang setup interaksi setelah story dirender
    this._setupCardInteractionEvents();
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
   * Mengatur event listener untuk interaksi mouse dan keyboard pada kartu cerita.
   */
  _setupCardInteractionEvents() {
    // Nama fungsi diperbarui
    // Gunakan event delegation jika memungkinkan, tapi untuk simplicity kita attach langsung
    const container = document.getElementById("stories-container");
    if (!container) return; // Pastikan container ada

    const cards = container.querySelectorAll(".story-card"); // Cari kartu di dalam container

    cards.forEach((card) => {
      const storyId = card.dataset.storyId;
      const lat = card.dataset.lat;
      const lon = card.dataset.lon;

      // Listener untuk mouse hover (jika masih diinginkan)
      card.addEventListener("mouseenter", () => {
        if (this.mapHandler && storyId && lat && lon) {
          this.mapHandler.highlightMarker(storyId);
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

  // Tambahkan method destroy untuk membersihkan map saat halaman berganti

  _scrollListener = null;

  async afterRender() {
    if (!authGuard.requireAuth()) return;

    this.mapHandler = new MapHandler("map");
    this.mapHandler.init();

    await this.presenter.loadStories({ location: 1 });
    this._setupCardInteractionEvents();

    // Panggil fungsi setup scroll listener (Baru)
    this._setupScrollListener();
  }
  _setupScrollListener() {
    const container = document.getElementById("home-page-container");
    const heroElement = document.querySelector(".home-hero"); // Elemen pemicu

    if (!container || !heroElement) return; // Pastikan elemen ada

    // Tentukan tinggi trigger (misalnya, setelah hero tidak terlihat)
    const triggerHeight = heroElement.offsetHeight;

    // Buat fungsi listener
    this._scrollListener = () => {
      if (window.scrollY > triggerHeight) {
        // Jika sudah scroll melewati hero, tambahkan kelas
        container.classList.add("scrolled-layout");
      } else {
        // Jika kembali ke atas, hapus kelas
        container.classList.remove("scrolled-layout");
      }
    };

    // Tambahkan listener ke window
    window.addEventListener("scroll", this._scrollListener);

    // Panggil sekali saat load untuk set state awal jika user refresh di tengah halaman
    this._scrollListener();
  }
  async destroy() {
    // Hapus scroll listener jika ada
    if (this._scrollListener) {
      window.removeEventListener("scroll", this._scrollListener);
      this._scrollListener = null; // Hapus referensi
      console.log("Scroll listener removed.");
    }

    // Hapus map handler
    if (this.mapHandler) {
      this.mapHandler.destroy();
      this.mapHandler = null;
      console.log("HomePage destroyed, map handler cleaned up.");
    }
  }
  async _setupFavoriteButtonListeners() {
    const container = document.getElementById("stories-container");
    if (!container) return;

    // 1. Dapatkan daftar ID favorit dari IndexedDB
    const favoriteStories = await DatabaseHelper.getAllFavoriteStories();
    const favoriteIds = favoriteStories.map((story) => story.id);

    const buttons = container.querySelectorAll(".btn-favorite");
    buttons.forEach((button) => {
      const storyId = button.dataset.storyId;

      // 2. Tandai tombol yang sudah difavoritkan
      if (favoriteIds.includes(storyId)) {
        button.classList.add("favorited");
        button.setAttribute(
          "aria-label",
          `Hapus cerita ${storyId} dari favorit`
        );
      } else {
        button.classList.remove("favorited");
        button.setAttribute(
          "aria-label",
          `Simpan cerita ${storyId} ke favorit`
        );
      }

      // 3. Tambahkan event listener
      button.addEventListener("click", async (event) => {
        event.stopPropagation(); // Hentikan event agar tidak memicu highlight peta

        const isFavorited = button.classList.contains("favorited");

        if (isFavorited) {
          // --- LOGIKA DELETE ---
          await DatabaseHelper.deleteFavoriteStory(storyId);
          button.classList.remove("favorited");
          button.setAttribute(
            "aria-label",
            `Simpan cerita ${storyId} ke favorit`
          );
          NotificationHelper.showToast("Cerita dihapus dari favorit", "info");
        } else {
          // --- LOGIKA CREATE ---
          // Temukan data cerita lengkap dari 'this.stories'
          const storyData = this.stories.find((story) => story.id === storyId);
          if (storyData) {
            await DatabaseHelper.putFavoriteStory(storyData);
            button.classList.add("favorited");
            button.setAttribute(
              "aria-label",
              `Hapus cerita ${storyId} dari favorit`
            );
            NotificationHelper.showToast("Cerita disimpan ke favorit");
          } else {
            NotificationHelper.showError(
              "Gagal menemukan data cerita untuk disimpan."
            );
          }
        }
      });
    });
  }
}
