import authModel from "../models/auth-model";

class AuthGuard {
  requireAuth() {
    if (!authModel.isAuthenticated()) {
      window.location.hash = "#/login";
      return false;
    }
    return true;
  }

  requireGuest() {
    if (authModel.isAuthenticated()) {
      window.location.hash = "#/";
      return false;
    }
    return true;
  }

  isAuthenticated() {
    return authModel.isAuthenticated();
  }

  getCurrentUser() {
    return authModel.getCurrentUser();
  }
}

export default new AuthGuard();
