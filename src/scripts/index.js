import "../styles/styles.css";
import App from "./pages/app";
import ThemeHandler from "./utils/theme-handler";

document.addEventListener("DOMContentLoaded", async () => {
  // Initialize theme handler
  const themeHandler = new ThemeHandler();

  // Setup theme toggle button
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      themeHandler.toggleTheme();
    });
  }

  // Initialize app
  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });

  await app.renderPage();

  // Handle hash change with View Transition API
  window.addEventListener("hashchange", async () => {
    // Check if View Transition API is supported
    if (document.startViewTransition) {
      document.startViewTransition(async () => {
        await app.renderPage();
      });
    } else {
      await app.renderPage();
    }
  });
});
