import StoryDetailPresenter from "../../presenters/story-detail-presenter";
import { parseActivePathname } from "../../routes/url-parser";
import LoadingSpinner from "../../components/loading-spinner";
import { showFormattedDate } from "../../utils";
import authGuard from "../../utils/auth-guard";

export default class StoryDetailPage {
  constructor() {
    this.presenter = new StoryDetailPresenter(this);
    this.container = null; // Kita akan simpan referensi ke container
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

  /**
   * Me-render HTML untuk detail cerita
   */
  displayStory(story) {
    if (!this.container) return;

    const hasLocation = story.lat && story.lon;

    this.container.innerHTML = `
      <article class="story-detail">
        <header class="story-detail-header">
          <h1 class="story-detail-author">${story.name}</h1>
          <p class="story-detail-date">${showFormattedDate(story.createdAt)}</p>
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
              ? `<div class="story-detail-location">
                  📍 ${parseFloat(story.lat).toFixed(4)}, ${parseFloat(
                  story.lon
                ).toFixed(4)}
                 </div>`
              : ""
          }
        </div>
      </article>
    `;
  }
}
