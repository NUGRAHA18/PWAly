import AuthPresenter from "../../presenters/auth-presenter";
import authGuard from "../../utils/auth-guard";
import { validators } from "../../utils/validators";
import NotificationHelper from "../../utils/notification-helper";

export default class LoginPage {
  constructor() {
    this.presenter = new AuthPresenter(this);
  }

  async render() {
    if (!authGuard.requireGuest()) return "";

    return `
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <h1 class="auth-title">Welcome Back</h1>
            <p class="auth-subtitle">Login to continue sharing your stories</p>
          </div>
          <form id="login-form" class="auth-form">
            <div class="form-group">
              <label for="email" class="form-label">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                class="form-input"
                placeholder="your@email.com"
                required
                autocomplete="email"
              />
              <span class="error-text" id="email-error"></span>
            </div>

            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                class="form-input"
                placeholder="Enter your password"
                required
                autocomplete="current-password"
              />
              <span class="error-text" id="password-error"></span>
            </div>

            <button type="submit" class="btn btn-primary btn-block" id="login-button">
              <span id="button-text">Login</span>
              <span id="button-spinner" class="spinner" style="display: none;"></span>
            </button>
          </form>

          <div class="auth-footer">
            Don't have an account?
            <a href="#/register" class="auth-link">Register here</a>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    if (!authGuard.requireGuest()) return;

    const form = document.getElementById("login-form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      this._clearErrors();

      const formData = {
        email: emailInput.value.trim(),
        password: passwordInput.value,
      };

      const validation = this._validateForm(formData);
      if (!validation.isValid) {
        this._displayErrors(validation.errors);
        return;
      }

      await this.presenter.handleLogin(formData);
    });

    emailInput.addEventListener("blur", () => {
      const error = validators.email(emailInput.value.trim());
      this._displayFieldError("email", error);
    });

    passwordInput.addEventListener("blur", () => {
      const error = validators.required(passwordInput.value, "Password");
      this._displayFieldError("password", error);
    });
  }

  _validateForm(formData) {
    const errors = {};
    let isValid = true;

    const emailError =
      validators.required(formData.email, "Email") ||
      validators.email(formData.email);
    if (emailError) {
      errors.email = emailError;
      isValid = false;
    }

    const passwordError =
      validators.required(formData.password, "Password") ||
      validators.minLength(formData.password, 8, "Password");
    if (passwordError) {
      errors.password = passwordError;
      isValid = false;
    }

    return { isValid, errors };
  }

  _displayErrors(errors) {
    for (const [field, message] of Object.entries(errors)) {
      this._displayFieldError(field, message);
      const input = document.getElementById(field);
      if (input) input.classList.add("error");
    }
  }

  _displayFieldError(field, error) {
    const errorElement = document.getElementById(`${field}-error`);
    const inputElement = document.getElementById(field);

    if (errorElement) {
      errorElement.textContent = error || "";
    }

    if (inputElement) {
      if (error) {
        inputElement.classList.add("error");
      } else {
        inputElement.classList.remove("error");
      }
    }
  }

  _clearErrors() {
    const errorElements = document.querySelectorAll(".error-text");
    errorElements.forEach((el) => (el.textContent = ""));

    const inputElements = document.querySelectorAll(".form-input");
    inputElements.forEach((el) => el.classList.remove("error"));
  }

  showLoading() {
    const button = document.getElementById("login-button");
    const text = document.getElementById("button-text");
    const spinner = document.getElementById("button-spinner");

    if (button) button.disabled = true;
    if (text) text.style.display = "none";
    if (spinner) spinner.style.display = "inline-block";

    NotificationHelper.showLoading(); // <-- Sekarang fungsi ini sudah tersedia
  }

  hideLoading() {
    const button = document.getElementById("login-button");
    const text = document.getElementById("button-text");
    const spinner = document.getElementById("button-spinner");

    if (button) button.disabled = false;
    if (text) text.style.display = "inline-block";
    if (spinner) spinner.style.display = "none";

    // GANTI BAGIAN SPINNER TOMBOL DENGAN INI:
    NotificationHelper.hideLoading(); // <-- Sekarang fungsi ini sudah tersedia
  }

  showSuccess(message) {
    NotificationHelper.showSuccess(message);
  }

  showError(message) {
    NotificationHelper.showError(message);
  }
}
