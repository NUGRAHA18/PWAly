// src/scripts/index.js

import "sweetalert2/dist/sweetalert2.min.css";
import "../styles/styles.css";
import App from "./pages/app";
import ThemeHandler from "./utils/theme-handler";
import PushNotificationHelper from "./utils/push-notification-helper";

const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Worker not supported in this browser.");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      "/service-worker.js"
    );
    console.log("Service Worker registered:", registration);

    const readyRegistration = await navigator.serviceWorker.ready;

    if (readyRegistration.active) {
      navigator.serviceWorker.addEventListener("message", async (event) => {
        if (event.data?.type === "SYNC_SUCCESS") {
          if (Notification.permission === "granted") {
            new Notification("Cerita Berhasil Diunggah!", {
              body: "Cerita yang tersimpan sudah berhasil diunggah ke server.",
              icon: "favicon.png",
            });
          } else {
            const { default: Swal } = await import("sweetalert2");
            Swal.fire({
              icon: "success",
              title: "Cerita Berhasil Diunggah!",
              text: "Cerita yang tersimpan sudah berhasil diunggah ke server.",
              timer: 3000,
              showConfirmButton: false,
            });
          }
        }
      });
    }
  } catch (error) {
    console.error("Service Worker registration failed:", error);
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  const themeHandler = new ThemeHandler();

  const themeToggle = document.getElementById("theme-toggle");
  themeToggle?.addEventListener("click", () => themeHandler.toggleTheme());

  const notificationToggle = document.getElementById("notification-toggle");
  notificationToggle?.addEventListener("click", async () => {
    await PushNotificationHelper.handleSubscriptionToggle();
  });

  let deferredInstallPrompt = null;
  const installButton = document.getElementById("install-button");

  if (installButton) {
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      installButton.style.display = "inline-flex";
    });

    installButton.addEventListener("click", async () => {
      if (!deferredInstallPrompt) return;

      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      console.log(
        `PWA installation ${outcome === "accepted" ? "accepted" : "dismissed"}.`
      );

      deferredInstallPrompt = null;
      installButton.style.display = "none";
    });

    if (window.matchMedia("(display-mode: standalone)").matches) {
      installButton.style.display = "none";
    }
  }

  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });

  await app.renderPage();
  await registerServiceWorker();
  PushNotificationHelper.updateToggleButton();

  if (localStorage.getItem("push-notification-enabled") === "true") {
    const isSubscribed = await PushNotificationHelper.isSubscribed();
    if (!isSubscribed) await PushNotificationHelper.subscribePush();
  }

  const progressBar = document.getElementById("scroll-progress-bar");
  if (progressBar) {
    window.addEventListener("scroll", () => {
      const totalHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const scrolled = (window.scrollY / totalHeight) * 100;
      progressBar.style.width = `${scrolled}%`;
    });
  }

  const scrollToTopBtn = document.getElementById("scroll-to-top");
  if (scrollToTopBtn) {
    window.addEventListener("scroll", () => {
      scrollToTopBtn.classList.toggle("visible", window.scrollY > 300);
    });

    scrollToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  window.addEventListener("hashchange", async () => {
    if (document.startViewTransition) {
      document.startViewTransition(async () => await app.renderPage());
    } else {
      await app.renderPage();
    }
  });
});
