class StoryCardSkeleton {
  static render() {
    return `
      <article class="story-card skeleton-card">
        <div class="skeleton skeleton-image"></div>
        <div class="story-card-content">
          <div class="skeleton skeleton-line skeleton-line-title"></div>
          <div class="skeleton skeleton-line skeleton-line-text"></div>
          <div class="skeleton skeleton-line skeleton-line-text-short"></div>
        </div>
      </article>
    `;
  }
}

export default StoryCardSkeleton;
