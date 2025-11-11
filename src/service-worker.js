// src/service-worker.js

// --- 1. Impor semua modul Workbox ---
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
  StaleWhileRevalidate,
  CacheFirst,
  NetworkOnly,
} from "workbox-strategies"; // ✅ TAMBAHKAN NetworkOnly
import { ExpirationPlugin } from "workbox-expiration";
import { clientsClaim } from "workbox-core";
import { BackgroundSyncPlugin } from "workbox-background-sync";

// --- 2. Konfigurasi dasar Service Worker ---
self.skipWaiting();
clientsClaim();

// --- 3. Caching App Shell (HANYA SATU KALI) ---
// Workbox akan menyuntikkan daftar file (HTML, CSS, JS) di sini
precacheAndRoute(self.__WB_MANIFEST);

// --- 4. Caching Aset Eksternal (Leaflet) ---
registerRoute(
  ({ request }) =>
    request.destination === "style" &&
    (request.url.includes("unpkg.com/leaflet") ||
      request.url.includes("fonts.googleapis.com")),
  new StaleWhileRevalidate({
    cacheName: "external-styles",
  })
);

registerRoute(
  ({ request }) =>
    request.destination === "script" &&
    request.url.includes("unpkg.com/leaflet"),
  new CacheFirst({
    cacheName: "external-scripts",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 hari
      }),
    ],
  })
);

// --- 5. Caching Dinamis untuk API (Menggunakan Path Lokal /v1/stories) ---
registerRoute(
  ({ url }) =>
    url.origin === self.origin && url.pathname.startsWith("/v1/stories"),
  new StaleWhileRevalidate({
    cacheName: "dicoding-api-stories",
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }),
    ],
  })
);

// --- 6. Caching Dinamis untuk Gambar API ---
registerRoute(
  ({ request }) =>
    request.destination === "image" &&
    request.url.includes("story-api.dicoding.dev"),
  new CacheFirst({
    cacheName: "dicoding-api-images",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  })
);

// --- 7. BACKGROUND SYNC PLUGIN (DIPERBAIKI) ---
const bgSyncPlugin = new BackgroundSyncPlugin("story-outbox-queue", {
  maxRetentionTime: 24 * 60, // Coba lagi selama 24 jam
  onSync: async ({ queue }) => {
    console.log("🔄 Service Worker: Background Sync dimulai...");
    let entry;

    while ((entry = await queue.shiftRequest())) {
      try {
        console.log("📤 Mencoba sync cerita:", entry.request.url);

        // Kirim request ke API
        const response = await fetch(entry.request);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        console.log("✅ Berhasil sync cerita!");

        // ✅ PERBAIKAN: Ambil ID dari URL atau request body
        const formData = await entry.request.formData();
        const storyId = formData.get("id");

        if (storyId) {
          // Kirim pesan ke client untuk hapus dari IndexedDB
          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({
              type: "SYNC_SUCCESS",
              storyId: storyId,
            });
          });
          console.log("📨 Pesan dikirim ke client untuk hapus story:", storyId);
        }
      } catch (error) {
        console.error("❌ Gagal sync cerita:", error);
        // Kembalikan ke antrian untuk dicoba lagi nanti
        await queue.unshiftRequest(entry);
        throw error; // Lempar error agar Workbox tahu ini gagal
      }
    }

    console.log("🎉 Background Sync selesai!");
  },
});

// --- 8. REGISTER ROUTE UNTUK POST STORIES (DIPERBAIKI) ---
registerRoute(
  ({ url, request }) =>
    url.origin === self.origin &&
    url.pathname.startsWith("/v1/stories") &&
    request.method === "POST", // ✅ Hanya POST request
  new NetworkOnly({
    // ✅ SEKARANG SUDAH DI-IMPORT
    plugins: [bgSyncPlugin],
  })
);

// --- 9. Logika Push Notification (HANYA SATU KALI) ---
self.addEventListener("push", (event) => {
  console.log("🔔 Service Worker: Push Notification diterima");

  let notificationData = {
    title: "StoryShare",
    options: {
      body: "Ada cerita baru yang diunggah!",
      icon: "favicon.png",
      badge: "favicon.png",
      data: {
        url: "#/",
      },
    },
  };

  try {
    const payload = event.data.json();
    notificationData.title = payload.title || "StoryShare";
    notificationData.options.body = payload.body || "Ada cerita baru!";
    notificationData.options.icon = payload.icon || "favicon.png";
    notificationData.options.data.url =
      payload.data?.url || payload.url || "#/";
  } catch (e) {
    console.warn(
      "Push event payload is not JSON, using default.",
      event.data.text()
    );
  }

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title,
      notificationData.options
    )
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("👆 Service Worker: Notification clicked");

  const notification = event.notification;
  const urlToOpen = notification.data.url || "#/";
  notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientsArr) => {
        const targetUrl = new URL(urlToOpen, self.location.origin).href;

        const existingClient = clientsArr.find(
          (client) => client.url === targetUrl
        );

        if (existingClient) {
          return existingClient.focus();
        } else {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// --- 10. LISTEN UNTUK PESAN DARI CLIENT (BARU) ---
self.addEventListener("message", async (event) => {
  if (event.data && event.data.type === "DELETE_OUTBOX_STORY") {
    console.log(
      "🗑️ Service Worker: Menerima perintah hapus outbox story:",
      event.data.storyId
    );
    // Logika hapus dari IndexedDB bisa dilakukan di sini jika perlu
    // Tapi lebih baik dilakukan di client (main thread)
  }
});

console.log("🚀 Service Worker loaded and ready!");
