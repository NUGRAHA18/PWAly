import storyRepository from "../data/story-repository";

class StoryModel {
  async getStories(options = {}) {
    return await storyRepository.getStories(options);
  }

  async getStoryDetail(id) {
    return await storyRepository.getStoryDetail(id);
  }

  async addStory(formData) {
    return await storyRepository.addStory(formData);
  }
}

export default new StoryModel();
