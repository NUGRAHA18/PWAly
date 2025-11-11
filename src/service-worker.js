// src/service-worker.js

// --- 1. Impor semua modul Workbox ---
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate, CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { clientsClaim } from "workbox-core";

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
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24, // 1 hari
      }),
    ],
  })
);

// --- 6. Caching Dinamis untuk Gambar API ---
registerRoute(
  ({ request }) =>
    request.destination === "image" &&
    request.url.includes("story-api.dicoding.dev"), // Ini benar menggunakan URL eksternal
  new CacheFirst({
    cacheName: "dicoding-api-images",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 hari
      }),
    ],
  })
);

// --- 7. Logika Push Notification (HANYA SATU KALI) ---

self.addEventListener("push", (event) => {
  console.log("Service Worker: Push Received.");

  let notificationData = {
    title: "StoryShare",
    options: {
      body: "Ada cerita baru yang diunggah!",
      icon: "favicon.png",
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
  console.log("Service Worker: Notification clicked.");

  const notification = event.notification;
  const urlToOpen = notification.data.url || "#/";
  notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientsArr) => {
        const targetUrl = new URL(urlToOpen, self.location.origin).href;

        const hadClient = clientsArr.some((client) => {
          return client.url === targetUrl && "focus" in client;
        });

        if (hadClient) {
          const existingClient = clientsArr.find(
            (client) => client.url === targetUrl
          );
          if (existingClient) {
            existingClient.focus();
          } else {
            clients.openWindow(urlToOpen);
          }
        } else {
          clients.openWindow(urlToOpen);
        }
      })
  );
});
