import storyModel from "../models/story-model";

class HomePresenter {
  constructor(view) {
    this.view = view;
  }

  async loadStories(options = {}) {
    this.view.showLoading();

    const result = await storyModel.getStories(options);

    this.view.hideLoading();

    return result;
  }
}

export default HomePresenter;
