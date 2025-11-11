import routes from "../routes/routes";
import { getActiveRoute } from "../routes/url-parser";
import authGuard from "../utils/auth-guard";
import authModel from "../models/auth-model";

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #currentPage = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._setupDrawer();
    this._updateNavigation();
  }

  _setupDrawer() {
    if (!this.#drawerButton || !this.#navigationDrawer) {
      console.warn("Drawer elements not found, skipping drawer setup.");
      return;
    }
    this.#drawerButton.addEventListener("click", () => {
      const isOpen = this.#navigationDrawer.classList.toggle("open");
      this.#drawerButton.setAttribute("aria-expanded", isOpen);
    });

    document.body.addEventListener("click", (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove("open");
        this.#drawerButton.setAttribute("aria-expanded", "false");
      }

      this.#navigationDrawer.querySelectorAll("a").forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove("open");
          this.#drawerButton.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  _updateNavigation() {
    const authNav = document.getElementById("auth-nav");
    if (!authNav) return;

    if (authGuard.isAuthenticated()) {
      const user = authGuard.getCurrentUser();
      authNav.innerHTML = `
        <span>${user?.name || "User"}</span>
        <a href="#" id="logout-link">Logout</a>
      `;

      const logoutLink = document.getElementById("logout-link");
      if (logoutLink) {
        logoutLink.addEventListener("click", (e) => {
          e.preventDefault();
          authModel.logout();
          window.location.hash = "#/login";
          this._updateNavigation();
        });
      }
    } else {
      authNav.innerHTML = `
        <a href="#/login">Login</a>
        <a href="#/register">Register</a>
      `;
    }
  }

  async renderPage() {
    if (this.#currentPage && typeof this.#currentPage.destroy === "function") {
      await this.#currentPage.destroy();
    }
    const url = getActiveRoute();
    const page = routes[url];
    this.#currentPage = page;

    if (page) {
      this.#content.innerHTML = await page.render();
      await page.afterRender();
      this._updateNavigation();
    } else {
      this.#content.innerHTML = `
        <div class="container">
          <div class="empty-state">
            <div class="empty-state-icon">404</div>
            <h2 class="empty-state-title">Page Not Found</h2>
            <p class="empty-state-description">
              The page you're looking for doesn't exist.
            </p>
            <a href="#/" class="btn btn-primary">Go Home</a>
          </div>
        </div>
      `;
      this.#currentPage = null;
    }
  }
}

export default App;
