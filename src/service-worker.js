// ==========================================
// 🔔 PUSH NOTIFICATION HANDLER
// ==========================================
// Ganti kode push handler di service-worker.js dengan ini:

// ✅ PUSH NOTIFICATION HANDLER - Mendukung berbagai format payload
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
  StaleWhileRevalidate,
  CacheFirst,
  NetworkOnly,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { clientsClaim } from "workbox-core";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { BackgroundSyncPlugin } from "workbox-background-sync";

self.skipWaiting();
clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);
self.addEventListener("push", (event) => {
  console.log("🔔 Service Worker: Push Notification diterima");

  const defaultNotification = {
    title: "StoryShare - Cerita Baru! 📖",
    options: {
      body: "Ada cerita baru yang baru saja dibagikan di StoryShare!",
      icon: "/favicon.png",
      badge: "/favicon.png",
      tag: "story-notification",
      requireInteraction: false,
      actions: [
        {
          action: "view",
          title: "Lihat Cerita",
          icon: "/favicon.png",
        },
        {
          action: "close",
          title: "Tutup",
        },
      ],
      data: {
        url: "/",
        dateOfArrival: Date.now(),
      },
    },
  };
  self.addEventListener("sync", (event) => {
    if (event.tag === "sync-new-stories") {
      console.log("🔄 Menerima event sync dari Outbox...");
      event.waitUntil(processOutboxQueue());
    }
  });
  registerRoute(
    ({ url }) =>
      url.origin === "https://story-api.dicoding.dev" &&
      (url.pathname === "/v1/stories" ||
        url.pathname.startsWith("/v1/stories/")), // Mencakup list dan detail
    new StaleWhileRevalidate({
      cacheName: "story-api-cache",
      plugins: [
        // Agar hanya merespon 200/OK (sukses)
        new CacheableResponsePlugin({
          statuses: [0, 200], // 0: Untuk permintaan cross-origin
        }),
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // Cache untuk 1 hari
        }),
      ],
    })
  );

  registerRoute(
    ({ request }) => request.destination === "image",
    new CacheFirst({
      cacheName: "story-image-cache",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // Cache untuk 30 hari
        }),
      ],
    })
  );
  async function processOutboxQueue() {
    // 1. Dapatkan referensi ke DatabaseHelper (atau buat ulang)
    // 2. Ambil semua cerita dari stories-outbox
    // 3. Iterasi dan coba kirim setiap cerita ke API
    // 4. Jika sukses, hapus dari outbox dan kirim pesan SYNC_SUCCESS
  }
  // ✅ Parse payload dengan aman (mendukung JSON dan text)
  let payload = null;
  if (event.data) {
    try {
      payload = event.data.json();
      console.log("📦 Payload JSON:", payload);
    } catch (errJson) {
      try {
        const text = event.data.text();
        payload = text ? { body: text } : null;
        console.log("📦 Payload Text:", text);
      } catch (errText) {
        console.warn("⚠️ Payload tidak dapat dibaca, menggunakan default");
        payload = null;
      }
    }
  }

  // ✅ Buat notification dengan data dari payload atau default
  const title = payload?.title ?? defaultNotification.title;
  const options = {
    ...defaultNotification.options,
    body: payload?.body ?? defaultNotification.options.body,
    icon: payload?.icon ?? defaultNotification.options.icon,
    badge: payload?.badge ?? defaultNotification.options.badge,
    data: {
      url:
        payload?.data?.url ??
        payload?.url ??
        defaultNotification.options.data.url,
      dateOfArrival: Date.now(),
      payload: payload,
    },
  };

  console.log("📤 Menampilkan notifikasi:", title);
  event.waitUntil(self.registration.showNotification(title, options));
});

// ==========================================
// 👆 NOTIFICATION CLICK HANDLER
// ==========================================

self.addEventListener("notificationclick", (event) => {
  console.log("👆 Notification clicked:", event.action);

  const notification = event.notification;
  const urlToOpen = notification?.data?.url || "/";

  notification.close();

  // ✅ Handle action buttons
  if (event.action === "close") {
    console.log("User closed the notification");
    return;
  }

  // ✅ Navigate ke URL (default action atau "view" button)
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientsArr) => {
        // Coba cari window yang sudah terbuka
        const existingClient = clientsArr.find((client) => {
          const clientUrl = new URL(client.url);
          const targetUrl = new URL(urlToOpen, self.location.origin);
          return clientUrl.origin === targetUrl.origin;
        });

        if (existingClient) {
          // Fokuskan window yang ada dan navigate
          return existingClient.focus().then((client) => {
            if (client.navigate) {
              return client.navigate(urlToOpen);
            }
          });
        } else {
          // Buka window baru
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

console.log("🚀 Push Notification Handler siap!");
