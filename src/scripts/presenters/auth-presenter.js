import authModel from "../models/auth-model";

class AuthPresenter {
  constructor(view) {
    this.view = view;
  }

  async handleRegister(formData) {
    this.view.showLoading();

    const result = await authModel.register(formData);

    this.view.hideLoading();

    if (result.success) {
      this.view.showSuccess(result.message);
      setTimeout(() => {
        window.location.hash = "#/login";
      }, 1500);
    } else {
      this.view.showError(result.message);
    }
  }

  async handleLogin(formData) {
    this.view.showLoading();

    const result = await authModel.login(formData);

    this.view.hideLoading();

    if (result.success) {
      this.view.showSuccess("Login successful!");
      setTimeout(() => {
        window.location.hash = "#/";
      }, 1000);
    } else {
      this.view.showError(result.message);
    }
  }

  handleLogout() {
    authModel.logout();
    window.location.hash = "#/login";
  }

  isAuthenticated() {
    return authModel.isAuthenticated();
  }

  getCurrentUser() {
    return authModel.getCurrentUser();
  }
}

export default AuthPresenter;
