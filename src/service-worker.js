// src/service-worker.js

import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
  StaleWhileRevalidate,
  CacheFirst,
  NetworkOnly,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { clientsClaim } from "workbox-core";
import { BackgroundSyncPlugin } from "workbox-background-sync";

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

// External styles (Leaflet, Google Fonts)
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

// API stories (lokal)
registerRoute(
  ({ url }) =>
    url.origin === self.location.origin &&
    url.pathname.startsWith("/v1/stories"),
  new StaleWhileRevalidate({
    cacheName: "dicoding-api-stories",
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }),
    ],
  })
);

// Gambar dari API
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

// Background Sync
const bgSyncPlugin = new BackgroundSyncPlugin("story-outbox-queue", {
  maxRetentionTime: 24 * 60, // menit
  onSync: async ({ queue }) => {
    console.log("🔄 Service Worker: Background Sync dimulai...");
    let entry;
    try {
      while ((entry = await queue.shiftRequest())) {
        try {
          console.log("📤 Mencoba sync cerita:", entry.request.url);
          const response = await fetch(entry.request);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          console.log("✅ Berhasil sync cerita!");

          const allClients = await self.clients.matchAll();
          allClients.forEach((client) => {
            client.postMessage({
              type: "SYNC_SUCCESS",
              message: "Cerita berhasil diunggah!",
            });
          });
        } catch (error) {
          console.error("❌ Gagal sync cerita:", error);
          // masukkan kembali ke antrian untuk dicoba nanti
          await queue.unshiftRequest(entry);
          throw error;
        }
      }
      console.log("🎉 Background Sync selesai!");
    } catch (syncErr) {
      console.error("Background sync loop error:", syncErr);
    }
  },
});

// NetworkOnly untuk endpoint login/register (hanya POST)
registerRoute(
  ({ url, request }) =>
    request.method === "POST" &&
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/v1/login") ||
      url.pathname.startsWith("/register")),
  new NetworkOnly()
);

// SINGLE, ROBUST PUSH HANDLER (tidak duplikat)
self.addEventListener("push", (event) => {
  console.log("🔔 Service Worker: Push Notification diterima");

  const defaultNotification = {
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

  // parsing payload dengan aman
  let payload = null;
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (errJson) {
      // jika bukan JSON, coba ambil textnya
      try {
        const text = event.data.text ? event.data.text() : null;
        payload = text ? { body: text } : null;
      } catch (errText) {
        payload = null;
      }
      console.warn(
        "Push event payload is not JSON, using fallback/text or default."
      );
    }
  }

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
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  console.log("👆 Service Worker: Notification clicked");

  const notification = event.notification;
  const urlToOpen = notification?.data?.url || "#/";
  notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientsArr) => {
        const targetUrl = new URL(urlToOpen, self.location.origin).href;
        const existingClient = clientsArr.find((client) => {
          // lebih toleran: cocokkan prefix atau exact match
          return client.url === targetUrl || client.url.startsWith(targetUrl);
        });

        if (existingClient) {
          return existingClient.focus();
        } else {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener("message", async (event) => {
  if (event.data && event.data.type === "DELETE_OUTBOX_STORY") {
    console.log(
      "🗑️ Service Worker: Menerima perintah hapus outbox story:",
      event.data.storyId
    );
    // Sebaiknya hapus di thread utama (client), tapi jika perlu bisa dilakukan di sini
  }
});

console.log("🚀 Service Worker loaded and ready!");
