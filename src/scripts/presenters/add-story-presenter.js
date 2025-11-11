import storyModel from "../models/story-model";
import DatabaseHelper from "../utils/database-helper"; // <-- 1. IMPOR HELPER BARU

class AddStoryPresenter {
  constructor(view) {
    this.view = view;
    this.storyModel = storyModel;
  }

  // 2. handleAddStory sekarang menerima 'storyData' (object)
  async handleAddStory(storyData) {
    this.view.showLoading();

    try {
      // 3. Buat FormData di dalam presenter
      const formData = new FormData();
      formData.append("description", storyData.description);
      formData.append("photo", storyData.photo, storyData.photo.name);

      if (storyData.lat && storyData.lon) {
        formData.append("lat", storyData.lat);
        formData.append("lon", storyData.lon);
      }

      // 4. (ONLINE PATH) Coba kirim ke API
      const result = await this.storyModel.addStory(formData);

      this.view.hideLoading();

      if (result.success) {
        this.view.showSuccess(result.message || "Story added successfully!");
        setTimeout(() => {
          window.location.hash = "#/";
        }, 1500);
      } else {
        // Ini adalah error API (misal: validasi gagal), BUKAN offline
        this.view.showError(result.message || "Failed to add story.");
      }
    } catch (error) {
      // 5. (OFFLINE PATH) Error 'fetch' dari repository akan ditangkap di sini
      this.view.hideLoading();
      console.warn("Failed to send story online, saving to outbox...", error);

      try {
        // Simpan data mentah ke IndexedDB
        await DatabaseHelper.putStory(storyData);
        this.view.showSuccess(
          "Cerita disimpan! Akan diunggah otomatis saat Anda kembali online."
        );
        setTimeout(() => {
          window.location.hash = "#/";
        }, 2000);
      } catch (dbError) {
        console.error("Failed to save story to outbox:", dbError);
        this.view.showError(
          "Gagal mengirim cerita dan gagal menyimpan ke offline storage."
        );
      }
    }
  }
}

export default AddStoryPresenter;
