// src/scripts/presenters/add-story-presenter.js (KODE LENGKAP DIPERBARUI)

import storyModel from "../models/story-model";
import DatabaseHelper from "../utils/database-helper";
import authRepository from "../data/auth-repository";
import authModel from "../models/auth-model"; // <-- 1. IMPORT BARU

class AddStoryPresenter {
  constructor(view) {
    this.view = view;
    this.storyModel = storyModel;
  }

  async handleAddStory(storyData) {
    this.view.showLoading();

    // 1. Generate ID untuk IndexedDB
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
      // 3. Coba kirim ke API dulu (ONLINE PATH)
      const result = await this.storyModel.addStory(formData);

      this.view.hideLoading();

      if (result.success) {
        this.view.showSuccess(result.message || "Cerita berhasil ditambahkan!");
        setTimeout(() => {
          window.location.hash = "#/";
        }, 1500);
      } else {
        // Ini seharusnya tidak terjadi jika repository melempar error
        this.view.showError(result.message || "Gagal menambahkan cerita.");
      }
    } catch (error) {
      // 4. ✅ [DIPERBARUI] BLOK CATCH YANG LEBIH CERDAS
      this.view.hideLoading();

      // Cek apakah ini error jaringan (offline sungguhan)
      const isOffline =
        error instanceof TypeError && error.message === "Failed to fetch";
      // Cek apakah ini error autentikasi
      const isAuthError =
        error.message.includes("authentication") ||
        error.message.includes("Unauthorized") ||
        error.message.includes("401");

      if (isOffline) {
        // --- INI LOGIKA OFFLINE YANG BENAR ---
        console.warn("📡 Offline mode detected:", error.message);

        const token = authRepository.getToken();
        if (!token) {
          console.error("❌ Tidak ada token, tidak bisa menyimpan ke outbox.");
          this.view.showError(
            "Anda harus login untuk menyimpan cerita offline."
          );
          return;
        }

        storyData.token = token; // Tambahkan token ke data outbox

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
      } else if (isAuthError) {
        // --- INI LOGIKA ERROR AUTENTIKASI (401) ---
        console.error("❌ Authentication error:", error.message);
        this.view.showError("Sesi Anda telah habis. Silakan login kembali.");

        // Hapus sisa token/user dan paksa ke halaman login
        setTimeout(() => {
          authModel.logout(); // Panggil logout dari model
          window.location.hash = "#/login";
        }, 2000);
      } else {
        // --- UNTUK ERROR LAINNYA (Misal: 500, 400) ---
        console.error("❌ Gagal menambah cerita (Error Lain):", error.message);
        this.view.showError(error.message || "Gagal menambahkan cerita.");
      }
    }
  }
}

export default AddStoryPresenter;
