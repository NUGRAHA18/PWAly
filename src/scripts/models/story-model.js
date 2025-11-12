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

  async deleteStory(id) {
    return await storyRepository.deleteStory(id);
  }
}

export default new StoryModel();
