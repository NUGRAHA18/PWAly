import CONFIG from "../config";

class AuthRepository {
  constructor() {
    this.baseUrl = CONFIG.BASE_URL;
  }

  async register({ name, email, password }) {
    try {
      const response = await fetch(`${this.baseUrl}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Network error occurred",
      };
    }
  }

  async login({ email, password }) {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      return {
        success: true,
        data: data.loginResult,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Network error occurred",
      };
    }
  }

  saveToken(token) {
    localStorage.setItem("auth-token", token);
  }

  getToken() {
    return localStorage.getItem("auth-token");
  }

  saveUser(user) {
    localStorage.setItem("auth-user", JSON.stringify(user));
  }

  getUser() {
    const userJson = localStorage.getItem("auth-user");
    return userJson ? JSON.parse(userJson) : null;
  }

  isAuthenticated() {
    return this.getToken() !== null;
  }

  logout() {
    localStorage.removeItem("auth-token");
    localStorage.removeItem("auth-user");
  }
}

export default new AuthRepository();
