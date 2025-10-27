import authGuard from "../../utils/auth-guard";
import HomePresenter from "../../presenters/home-presenter";
import StoryList from "../../components/story-list";
import LoadingSpinner from "../../components/loading-spinner";
import MapHandler from "../../utils/map-handler";

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
      <section class="container">
        <div class="home-hero">
          <h1>Selamat Datang, ${user?.name || "User"}!</h1>
          <p>Bagikan ceritamu dengan dunia</p>
        </div>

        <div class="stories-controls">
          <div class="stories-header">
            <h2 class="stories-title">Cerita Terbaru</h2>
            <span class="stories-count" id="stories-count"></span>
          </div>
          <div class="stories-actions">
            <a href="#/add-story" class="btn btn-primary">
              + Tambah Cerita
            </a>
          </div>
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

    this._setupCardHoverEvents();
  }

  showLoading() {
    const container = document.getElementById("stories-container");
    if (container) {
      container.innerHTML = LoadingSpinner.render();
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

  _setupCardHoverEvents() {
    const cards = document.querySelectorAll(".story-card");

    cards.forEach((card) => {
      const storyId = card.dataset.storyId;

      card.addEventListener("mouseenter", () => {
        if (this.mapHandler) {
          this.mapHandler.highlightMarker(storyId);
        }
      });

      card.addEventListener("click", () => {
        if (this.mapHandler) {
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
}
