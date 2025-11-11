import storyModel from "../models/story-model";

class StoryDetailPresenter {
  constructor(view) {
    this.view = view;
    this.storyModel = storyModel;
  }

  /**
   * Mengambil detail cerita dari model berdasarkan ID
   */
  async loadStory(id) {
    this.view.showLoading();
    try {
      const result = await this.storyModel.getStoryDetail(id);

      if (result.success) {
        this.view.displayStory(result.data);
      } else {
        this.view.showError(result.message);
      }
    } catch (error) {
      this.view.showError(error.message);
    }
  }
}

export default StoryDetailPresenter;
