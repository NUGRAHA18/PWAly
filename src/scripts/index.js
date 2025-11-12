// src/scripts/index.js

import "sweetalert2/dist/sweetalert2.min.css";
import "../styles/styles.css";
import App from "./pages/app";
import ThemeHandler from "./utils/theme-handler";
import PushNotificationHelper from "./utils/push-notification-helper";

// Fungsi untuk mendaftarkan Service Worker
const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(
        "./service-worker.js"
      );
      console.log("✅ Service Worker registered:", registration);

      // ✅ TAMBAHAN: Listen untuk message dari Service Worker
      navigator.serviceWorker.addEventListener("message", async (event) => {
        console.log("📨 Pesan dari Service Worker:", event.data);

        if (event.data && event.data.type === "SYNC_SUCCESS") {
          console.log("✅ Background sync berhasil!");

          // Optional: Tampilkan notifikasi ke user
          if (Notification.permission === "granted") {
            new Notification("Cerita Berhasil Diunggah! 🎉", {
              body: "Cerita yang tersimpan sudah berhasil diunggah ke server.",
              icon: "favicon.png",
            });
          }

          // Optional: Reload page untuk refresh data
          // window.location.reload();
        }
      });
    } catch (error) {
      console.error("❌ Service Worker registration failed:", error);
    }
  } else {
    console.log("⚠️ Service Worker not supported in this browser.");
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  const themeHandler = new ThemeHandler();

  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      themeHandler.toggleTheme();
    });
  }

  // Event listener untuk tombol notifikasi
  const notificationToggle = document.getElementById("notification-toggle");
  if (notificationToggle) {
    notificationToggle.addEventListener("click", () => {
      PushNotificationHelper.handleSubscriptionToggle();
    });
  }

  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });

  await app.renderPage();

  // Panggil registrasi Service Worker
  await registerServiceWorker();

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
