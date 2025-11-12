import CONFIG from "../config";

class AuthRepository {
  constructor() {
    this.baseUrl = CONFIG.BASE_URL;
  }

  async register({ name, email, password }) {
    try {
      const response = await fetch(`${this.baseUrl}/v1/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || "Registration failed");
        } catch (e) {
          throw new Error(e.message || "Registration failed");
        }
      }

      const data = await response.json();

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
      const response = await fetch(`${this.baseUrl}/v1/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || "Login failed");
        } catch (e) {
          throw new Error(e.message || "Login failed");
        }
      }

      const data = await response.json();

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
    sessionStorage.setItem("auth-token", token);
  }

  getToken() {
    return sessionStorage.getItem("auth-token");
  }

  saveUser(user) {
    sessionStorage.setItem("auth-user", JSON.stringify(user));
  }

  getUser() {
    const userJson = sessionStorage.getItem("auth-user");
    return userJson ? JSON.parse(userJson) : null;
  }

  isAuthenticated() {
    return this.getToken() !== null;
  }

  logout() {
    sessionStorage.removeItem("auth-token");
    sessionStorage.removeItem("auth-user");
  }
}

export default new AuthRepository();
