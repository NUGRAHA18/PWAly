// src/scripts/index.js

import "sweetalert2/dist/sweetalert2.min.css";
import "../styles/styles.css";
import App from "./pages/app";
import ThemeHandler from "./utils/theme-handler";
import PushNotificationHelper from "./utils/push-notification-helper";

const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(
        "/service-worker.js"
      );
      console.log("✅ Service Worker registered:", registration);

      // Tunggu sampai Service Worker siap
      const readyRegistration = await navigator.serviceWorker.ready;

      // 🔄 Pastikan listener pesan aktif setelah SW siap
      readyRegistration.active &&
        navigator.serviceWorker.addEventListener("message", async (event) => {
          console.log("📨 Pesan dari Service Worker:", event.data);

          if (event.data && event.data.type === "SYNC_SUCCESS") {
            console.log("✅ Background sync berhasil!");

            if (Notification.permission === "granted") {
              new Notification("Cerita Berhasil Diunggah! 🎉", {
                body: "Cerita yang tersimpan sudah berhasil diunggah ke server.",
                icon: "favicon.png",
              });
            } else {
              // ✅ Gunakan fallback jika notifikasi diblokir
              console.warn("🔕 Notifikasi diblokir oleh pengguna.");
              import("sweetalert2").then(({ default: Swal }) => {
                Swal.fire({
                  icon: "success",
                  title: "Cerita Berhasil Diunggah! 🎉",
                  text: "Cerita yang tersimpan sudah berhasil diunggah ke server.",
                  timer: 3000,
                  showConfirmButton: false,
                });
              });
            }

            // Optional: reload halaman untuk memperbarui data
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

  // ✅✅✅ TAMBAHAN: Event listener untuk tombol notifikasi
  const notificationToggle = document.getElementById("notification-toggle");
  if (notificationToggle) {
    notificationToggle.addEventListener("click", async () => {
      console.log("🔔 Tombol notifikasi diklik");
      await PushNotificationHelper.handleSubscriptionToggle();
    });
  }
  // ✅✅✅ AKHIR TAMBAHAN

  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });

  await app.renderPage();

  // Daftarkan SW
  await registerServiceWorker();

  // ✅ Update tombol notifikasi setelah SW ready
  PushNotificationHelper.updateToggleButton();

  // Cek apakah sebelumnya sudah subscribe
  const wasSubscribed =
    localStorage.getItem("push-notification-enabled") === "true";
  if (wasSubscribed) {
    // Re-subscribe jika sebelumnya aktif
    PushNotificationHelper.isSubscribed().then((isSubscribed) => {
      if (!isSubscribed) {
        console.log("🔄 Re-subscribing ke push notification...");
        PushNotificationHelper.subscribePush();
      }
    });
  }

  // Re-render halaman saat hash berubah (SPA)
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
