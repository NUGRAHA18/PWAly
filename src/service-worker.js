import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate, CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { clientsClaim } from "workbox-core";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import DatabaseHelper from "./scripts/utils/database-helper";

self.skipWaiting();
clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ url }) =>
    url.origin === "https://story-api.dicoding.dev" &&
    (url.pathname === "/v1/stories" || url.pathname.startsWith("/v1/stories/")),
  new StaleWhileRevalidate({
    cacheName: "story-api-cache",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 }),
    ],
  })
);

// Cache untuk Gambar
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "story-image-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

async function sendStory(story) {
  try {
    const token = story.token;
    if (!token) {
      throw new Error("Token tidak ditemukan di data outbox. Hapus item.");
    }

    const formData = new FormData();
    formData.append("description", story.description);
    formData.append("photo", story.photo, story.photo.name);
    if (story.lat && story.lon) {
      formData.append("lat", story.lat);
      formData.append("lon", story.lon);
    }

    const response = await fetch("https://story-api.dicoding.dev/v1/stories", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // JANGAN set 'Content-Type' untuk FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        console.error("Token kadaluarsa untuk story", story.id);
        await DatabaseHelper.deleteOutboxStory(story.id);
        return false;
      }
      throw new Error(errorData.message || "Gagal sinkronisasi");
    }

    await DatabaseHelper.deleteOutboxStory(story.id);
    console.log("✅ Cerita berhasil disinkronkan:", story.id);
    return true; // Sukses
  } catch (error) {
    console.error("❌ Gagal sinkronisasi cerita:", story.id, error);

    if (error.message.includes("Token tidak ditemukan")) {
      await DatabaseHelper.deleteOutboxStory(story.id);
    }

    return false;
  }
}

async function processOutboxQueue() {
  console.log("🔄 Memproses antrian outbox...");

  const stories = await DatabaseHelper.getAllOutboxStories();
  if (stories.length === 0) {
    console.log("📤 Outbox kosong, tidak ada yang disinkronkan.");
    return;
  }

  const results = await Promise.all(stories.map(sendStory));

  const successCount = results.filter(Boolean).length;
  console.log(
    `Sync selesai: ${successCount} sukses, ${
      stories.length - successCount
    } gagal.`
  );

  if (successCount > 0) {
    const clients = await self.clients.matchAll({
      includeUncontrolled: true,
      type: "window",
    });

    clients.forEach((client) => {
      client.postMessage({ type: "SYNC_SUCCESS" });
    });
  }
}

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-new-stories") {
    console.log("🔄 Menerima event sync dari Outbox...");
    event.waitUntil(processOutboxQueue());
  }
});

self.addEventListener("push", (event) => {
  console.log("🔔 Service Worker: Push Notification diterima");
  // ... (sisa kode push handler)
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

self.addEventListener("notificationclick", (event) => {
  console.log("👆 Notification clicked:", event.action);
  // ... (sisa kode notification click handler)
  const notification = event.notification;
  const urlToOpen = notification?.data?.url || "/";

  notification.close();

  // Handle action buttons
  if (event.action === "close") {
    console.log("User closed the notification");
    return;
  }

  // Navigate ke URL (default action atau "view" button)
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

console.log("🚀 Service Worker Siap (Caching, Sync, & Push Aktif)!");
