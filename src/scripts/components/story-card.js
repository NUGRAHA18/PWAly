import { showFormattedDate } from "../utils";

class StoryCard {
  static render(story) {
    const hasLocation = story.lat && story.lon;

    return `
      <article class="story-card" data-story-id="${story.id}" data-lat="${
      story.lat || ""
    }" data-lon="${story.lon || ""}">
        <img 
          src="${story.photoUrl}" 
          alt="${story.description}"
          class="story-card-image"
          loading="lazy"
        />
        <div class="story-card-content">
          <div class="story-card-header">
            <h3 class="story-card-author">${story.name}</h3>
            <span class="story-card-date">${showFormattedDate(
              story.createdAt
            )}</span>
          </div>
          <p class="story-card-description">${story.description}</p>
          ${
            hasLocation
              ? `
            <div class="story-card-footer">
              <span class="story-card-location">
                📍 ${story.lat.toFixed(4)}, ${story.lon.toFixed(4)}
              </span>
            </div>
          `
              : ""
          }
        </div>
      </article>
    `;
  }
}

export default StoryCard;
