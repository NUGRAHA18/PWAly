import StoryCardSkeleton from "./story-card-skeleton";

class StoryListSkeleton {
  /**
   *
   * @param {number} count
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
