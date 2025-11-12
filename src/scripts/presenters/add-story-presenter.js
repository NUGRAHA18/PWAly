// src/scripts/presenters/add-story-presenter.js (VERSI DIPERBAIKI)

import storyModel from "../models/story-model";
import DatabaseHelper from "../utils/database-helper";
import authRepository from "../data/auth-repository";
import authModel from "../models/auth-model";

class AddStoryPresenter {
  constructor(view) {
    this.view = view;
    this.storyModel = storyModel;
  }

  async handleAddStory(storyData) {
    this.view.showLoading();

    // 1. Generate ID untuk IndexedDB (jika nanti offline)
    const storyId = Date.now().toString();
    storyData.id = storyId;

    // 2. Buat FormData
    const formData = new FormData();
    formData.append("description", storyData.description);
    formData.append("photo", storyData.photo, storyData.photo.name);
    if (storyData.lat && storyData.lon) {
      formData.append("lat", storyData.lat);
      formData.append("lon", storyData.lon);
    }

    try {
      // 3. Coba kirim ke API (ONLINE PATH)
      const result = await this.storyModel.addStory(formData);

      this.view.hideLoading();

      if (result.success) {
        this.view.showSuccess(result.message || "Cerita berhasil ditambahkan!");
        setTimeout(() => {
          window.location.hash = "#/";
        }, 1500);
      } else {
        // Fallback jika repository return { success: false }
        this.view.showError(result.message || "Gagal menambahkan cerita.");
      }
    } catch (error) {
      // 4. ✅ PERBAIKAN: Deteksi error dengan lebih akurat
      this.view.hideLoading();

      console.error("❌ Gagal menambah cerita:", error.message);

      // --- Cek apakah ini error OFFLINE (jaringan) ---
      const isNetworkError =
        error instanceof TypeError ||
        error.message === "Failed to fetch" ||
        error.message.includes("NetworkError") ||
        error.message.includes("fetch");

      // --- Cek apakah ini error AUTENTIKASI (401/403) ---
      const isAuthError =
        error.message.includes("Unauthorized") ||
        error.message.includes("authentication") ||
        error.message.includes("401") ||
        error.message.includes("403") ||
        error.message.includes("token");

      if (isNetworkError && !isAuthError) {
        // ========== OFFLINE MODE ==========
        console.warn("📡 Mode offline terdeteksi");

        const token = authRepository.getToken();
        if (!token) {
          console.error("❌ Tidak ada token untuk menyimpan offline");
          this.view.showError(
            "Anda harus login untuk menyimpan cerita offline."
          );
          return;
        }

        storyData.token = token; // Tambahkan token untuk sync nanti

        try {
          await DatabaseHelper.putOutboxStory(storyData);
          this.view.showSuccess(
            "📤 Kamu sedang offline. Cerita akan otomatis diunggah saat online kembali!"
          );
          setTimeout(() => {
            window.location.hash = "#/";
          }, 2000);
        } catch (dbError) {
          console.error("❌ Gagal menyimpan ke IndexedDB:", dbError);
          this.view.showError(
            "Gagal menyimpan cerita. Pastikan browser mendukung penyimpanan lokal."
          );
        }
      } else if (isAuthError) {
        // ========== AUTHENTICATION ERROR ==========
        console.error("❌ Error autentikasi:", error.message);
        this.view.showError(
          "Sesi Anda telah habis atau token tidak valid. Silakan login kembali."
        );

        // Hapus token dan redirect ke login
        setTimeout(() => {
          authModel.logout();
          window.location.hash = "#/login";
        }, 2000);
      } else {
        // ========== ERROR LAINNYA (400, 500, dsb) ==========
        console.error("❌ Error dari server:", error.message);
        this.view.showError(
          error.message || "Gagal menambahkan cerita. Coba lagi nanti."
        );
      }
    }
  }
}

export default AddStoryPresenter;
