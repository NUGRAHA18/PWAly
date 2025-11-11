// Ini adalah isi yang BENAR untuk src/scripts/data/story-repository.js
import CONFIG from "../config";
import authRepository from "./auth-repository";

class StoryRepository {
  constructor() {
    this.baseUrl = CONFIG.BASE_URL; // Ini "" (kosong)
  }

  async getStories({ page = 1, size = 20, location = 1 } = {}) {
    try {
      const token = authRepository.getToken();
      const params = new URLSearchParams({ page, size, location });

      // Perbaikan Path: Tambahkan /v1/
      const response = await fetch(`${this.baseUrl}/v1/stories?${params}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Perbaikan Poin 4: Cek .ok dulu
      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || "Gagal mengambil data");
        } catch (e) {
          throw new Error(e.message || "Gagal mengambil data");
        }
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format");
      }

      const data = await response.json();

      return {
        success: true,
        data: data.listStory || [],
      };
    } catch (error) {
      console.error("Get stories error:", error);
      return {
        success: false,
        message: error.message || "Terjadi kesalahan",
        data: [],
      };
    }
  }

  async getStoryDetail(id) {
    try {
      const token = authRepository.getToken();

      // Perbaikan Path: Tambahkan /v1/
      const response = await fetch(`${this.baseUrl}/v1/stories/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Perbaikan Poin 4: Cek .ok dulu
      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || "Gagal mengambil detail");
        } catch (e) {
          throw new Error(e.message || "Gagal mengambil detail");
        }
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format");
      }

      const data = await response.json();

      return {
        success: true,
        data: data.story,
      };
    } catch (error) {
      console.error("Get story detail error:", error);
      return {
        success: false,
        message: error.message || "Terjadi kesalahan",
      };
    }
  }

  async addStory(formData) {
    try {
      const token = authRepository.getToken();

      // Perbaikan Path: Tambahkan /v1/
      const response = await fetch(`${this.baseUrl}/v1/stories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // Perbaikan Poin 4: Cek .ok dulu
      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || "Gagal menambahkan cerita");
        } catch (e) {
          throw new Error(e.message || "Gagal menambahkan cerita");
        }
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format");
      }

      const data = await response.json();

      return {
        success: true,
        message: data.message || "Cerita berhasil ditambahkan",
      };
    } catch (error) {
      console.error("Add story error:", error);
      return {
        success: false,
        message: error.message || "Terjadi kesalahan",
      };
    }
  }
}

export default new StoryRepository();
