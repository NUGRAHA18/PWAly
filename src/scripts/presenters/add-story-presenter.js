// src/scripts/presenters/add-story-presenter.js

import storyModel from "../models/story-model";
import DatabaseHelper from "../utils/database-helper";

class AddStoryPresenter {
  constructor(view) {
    this.view = view;
    this.storyModel = storyModel;
  }

  /**
   * ✅ DIPERBAIKI: Logika offline yang benar
   * 1. Buat FormData DULU (dengan ID)
   * 2. Coba kirim ke API
   * 3. Jika OFFLINE (error network), simpan ke outbox + IndexedDB
   */
  async handleAddStory(storyData) {
    this.view.showLoading();

    // 1. Generate ID untuk IndexedDB (bukan untuk API)
    const storyId = Date.now().toString();
    storyData.id = storyId;

    // 2. ✅ Buat FormData TANPA id (API Dicoding tidak terima field id)
    const formData = new FormData();
    formData.append("description", storyData.description);
    formData.append("photo", storyData.photo, storyData.photo.name);

    // Tambahkan lokasi jika ada
    if (storyData.lat && storyData.lon) {
      formData.append("lat", storyData.lat);
      formData.append("lon", storyData.lon);
    }

    try {
      // 3. ✅ Coba kirim ke API dulu (ONLINE PATH)
      const result = await this.storyModel.addStory(formData);

      this.view.hideLoading();

      if (result.success) {
        this.view.showSuccess(result.message || "Cerita berhasil ditambahkan!");
        setTimeout(() => {
          window.location.hash = "#/";
        }, 1500);
      } else {
        this.view.showError(result.message || "Gagal menambahkan cerita.");
      }
    } catch (error) {
      // 4. ✅ OFFLINE PATH - Error akan ditangkap di sini
      this.view.hideLoading();

      console.warn("📡 Offline mode detected:", error.message);

      // Simpan data mentah ke IndexedDB (pakai id untuk indexing)
      try {
        await DatabaseHelper.putOutboxStory(storyData);

        this.view.showSuccess(
          "Kamu sedang offline. Cerita akan otomatis diunggah saat online kembali! 📤"
        );

        setTimeout(() => {
          window.location.hash = "#/";
        }, 2000);
      } catch (dbError) {
        console.error("❌ Gagal menyimpan ke IndexedDB:", dbError);
        this.view.showError(
          "Gagal menyimpan cerita. Pastikan browser mendukung IndexedDB."
        );
      }
    }
  }
}

export default AddStoryPresenter;
