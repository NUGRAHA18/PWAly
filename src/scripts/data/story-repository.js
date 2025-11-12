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

      const response = await fetch(`${this.baseUrl}/v1/stories?${params}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Gagal mengambil data");
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

      const response = await fetch(`${this.baseUrl}/v1/stories/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Gagal mengambil detail");
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

      const response = await fetch(`${this.baseUrl}/v1/stories`, {
        method: "POST",
        headers: {},
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || "Gagal menambahkan cerita";
        throw new Error(errorMessage);
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
      throw error;
    }
  }
}

export default new StoryRepository();
