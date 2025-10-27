import CONFIG from "../config";
import authRepository from "./auth-repository";

class StoryRepository {
  constructor() {
    this.baseUrl = CONFIG.BASE_URL;
  }

  async getStories({ page = 1, size = 20, location = 1 } = {}) {
    try {
      const token = authRepository.getToken();
      const params = new URLSearchParams({ page, size, location });

      const response = await fetch(`${this.baseUrl}/stories?${params}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil data");
      }

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

      const response = await fetch(`${this.baseUrl}/stories/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil detail");
      }

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

      const response = await fetch(`${this.baseUrl}/stories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal menambahkan cerita");
      }

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
