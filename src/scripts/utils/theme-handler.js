class ThemeHandler {
  constructor() {
    this.themeKey = "app-theme";
    this.currentTheme = this._getStoredTheme() || "dark";
    this._initTheme();
  }

  _getStoredTheme() {
    return localStorage.getItem(this.themeKey);
  }

  _setStoredTheme(theme) {
    localStorage.setItem(this.themeKey, theme);
  }

  _initTheme() {
    document.documentElement.setAttribute("data-theme", this.currentTheme);
    this._updateThemeButton();
  }

  _updateThemeButton() {
    const themeButton = document.getElementById("theme-toggle");
    if (themeButton) {
      const icon = themeButton.querySelector(".toggle-icon");
      if (icon) {
        icon.textContent = this.currentTheme === "dark" ? "☀️" : "🌙";
      } else {
        // Fallback jika struktur lama
        themeButton.textContent = this.currentTheme === "dark" ? "☀️" : "🌙";
      }

      themeButton.setAttribute(
        "aria-label",
        this.currentTheme === "dark"
          ? "Switch to light theme"
          : "Switch to dark theme"
      );

      themeButton.setAttribute(
        "title",
        this.currentTheme === "dark" ? "Mode Terang" : "Mode Gelap"
      );
    }
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", this.currentTheme);
    this._setStoredTheme(this.currentTheme);
    this._updateThemeButton();
  }

  getTheme() {
    return this.currentTheme;
  }

  setTheme(theme) {
    if (theme !== "dark" && theme !== "light") {
      console.error('Invalid theme. Use "dark" or "light"');
      return;
    }
    this.currentTheme = theme;
    document.documentElement.setAttribute("data-theme", this.currentTheme);
    this._setStoredTheme(this.currentTheme);
    this._updateThemeButton();
  }
}

export default ThemeHandler;
