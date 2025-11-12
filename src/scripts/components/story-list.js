import StoryCard from "./story-card";

class StoryList {
  static render(stories, options = {}) {
    if (!stories || stories.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">📖</div>
          <h3 class="empty-state-title">Belum Ada Cerita</h3>
          <p class="empty-state-description">
            Jadilah yang pertama membagikan cerita!
          </p>
          <a href="#/add-story" class="btn btn-primary">Buat Cerita Pertama</a>
        </div>
      `;
    }

    return `
      <div class="stories-grid">
        ${stories.map((story) => StoryCard.render(story, options)).join("")}
      </div>
    `;
  }
}

export default StoryList;
