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
    const storyId = new Date().toISOString();
    storyData.id = storyId;

    try {
      // 3. Buat FormData di dalam presenter
      await DatabaseHelper.putOutboxStory(storyData); // Gunakan fungsi outbox

      this.view.showSuccess(
        "Anda sedang offline. Cerita disimpan & akan diunggah otomatis saat Anda kembali online."
      );
      // ...
      const formData = new FormData();
      formData.append("id", storyData.id);
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
        await DatabaseHelper.deleteStory(storyId);
        this.view.showSuccess(result.message || "Story added successfully!");
        setTimeout(() => {
          window.location.hash = "#/";
        }, 1500);
      } else {
        // Ini adalah error API (misal: validasi gagal), BUKAN offline
        this.view.showError(result.message || "Failed to add story.");
      }
    } catch (error) {
      // 5. (OFFLINE PATH) Error 'fetch' akan ditangkap di sini
      this.view.hideLoading();
      console.warn("Failed to send story (offline), saved to outbox.", error);

      // Data sudah ada di IndexedDB, Workbox (BackgroundSync) akan mengambil alih
      this.view.showSuccess(
        "Anda sedang offline. Cerita disimpan & akan diunggah otomatis saat Anda kembali online."
      );
      setTimeout(() => {
        window.location.hash = "#/";
      }, 2000);
    }
  }
}

export default AddStoryPresenter;
