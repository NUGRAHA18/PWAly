import "../styles/styles.css";
import App from "./pages/app";
import ThemeHandler from "./utils/theme-handler";
import "sweetalert2/dist/sweetalert2.min.css";

document.addEventListener("DOMContentLoaded", async () => {
  const themeHandler = new ThemeHandler();

  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      themeHandler.toggleTheme();
    });
  }

  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });

  await app.renderPage();

  window.addEventListener("hashchange", async () => {
    if (document.startViewTransition) {
      document.startViewTransition(async () => {
        await app.renderPage();
      });
    } else {
      await app.renderPage();
    }
  });
});
