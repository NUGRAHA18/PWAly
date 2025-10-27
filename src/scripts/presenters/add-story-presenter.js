import storyModel from "../models/story-model";

class AddStoryPresenter {
  constructor(view) {
    this.view = view;
    this.storyModel = storyModel;
  }

  async handleAddStory(formData) {
    // formData diharapkan sudah berupa instance FormData
    this.view.showLoading();

    const result = await this.storyModel.addStory(formData);

    this.view.hideLoading();

    if (result.success) {
      this.view.showSuccess(result.message || "Story added successfully!");
      // Redirect ke home setelah beberapa saat
      setTimeout(() => {
        window.location.hash = "#/";
      }, 1500);
    } else {
      this.view.showError(result.message || "Failed to add story.");
    }
  }
}

export default AddStoryPresenter;
