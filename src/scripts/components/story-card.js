import { showFormattedDate } from "../utils";

class StoryCard {
  static render(story) {
    const hasLocation = story.lat && story.lon;

    return `
      <article
        class="story-card"
        data-story-id="${story.id}"
        data-lat="${story.lat || ""}"
        data-lon="${story.lon || ""}"
        tabindex="0"  aria-label="Story by ${
          story.name
        }: ${story.description.substring(0, 50)}..." >
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
          
          <div class="story-card-footer">
            <span class="story-card-location">
              ${
                hasLocation
                  ? `📍 ${parseFloat(story.lat).toFixed(4)}, ${parseFloat(
                      story.lon
                    ).toFixed(4)}`
                  : ""
              }
            </span>
            
            <button 
              class="btn-favorite" 
              aria-label="Simpan cerita ${story.name} ke favorit" 
              title="Simpan ke favorit"
              data-story-id="${story.id}"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-bookmark"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            </button>
          </div>

        </div>
      </article>
    `;
  }
}

export default StoryCard;
