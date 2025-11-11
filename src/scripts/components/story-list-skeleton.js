import StoryCardSkeleton from "./story-card-skeleton";

class StoryListSkeleton {
  /**
   * Render beberapa skeleton card.
   * @param {number} count - Jumlah skeleton yang ingin ditampilkan.
   */
  static render(count = 6) {
    let skeletons = "";
    for (let i = 0; i < count; i++) {
      skeletons += StoryCardSkeleton.render();
    }

    return `
      <div class="stories-grid">
        ${skeletons}
      </div>
    `;
  }
}

export default StoryListSkeleton;
