import authRepository from "../data/auth-repository";

class AuthModel {
  async register(userData) {
    const result = await authRepository.register(userData);
    return result;
  }

  async login(credentials) {
    const result = await authRepository.login(credentials);

    if (result.success) {
      authRepository.saveToken(result.data.token);
      authRepository.saveUser({
        userId: result.data.userId,
        name: result.data.name,
      });
    }

    return result;
  }

  logout() {
    authRepository.logout();
  }

  isAuthenticated() {
    return authRepository.isAuthenticated();
  }

  getCurrentUser() {
    return authRepository.getUser();
  }

  getToken() {
    return authRepository.getToken();
  }
}

export default new AuthModel();
