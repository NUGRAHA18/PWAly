import storyModel from "../models/story-model";

class HomePresenter {
  constructor(view) {
    this.view = view;
  }

  async loadStories(options = {}) {
    this.view.showLoading();

    const result = await storyModel.getStories(options);

    this.view.hideLoading();

    if (result.success) {
      this.view.displayStories(result.data);
      this.view.displayMap(result.data);
    } else {
      this.view.showError(result.message);
    }
  }
}

export default HomePresenter;
