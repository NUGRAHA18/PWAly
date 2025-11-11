self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
});

self.addEventListener("fetch", (event) => {
  // console.log('Service Worker: Fetching', event.request.url);
});

self.addEventListener("push", (event) => {
  console.log("Service Worker: Push Received.");
});

self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked.");
});

self.addEventListener("push", (event) => {
  console.log("Service Worker: Push Received.");

  let notificationData = {
    title: "Notifikasi Baru!",
    options: {
      body: "Ada konten baru untuk Anda.",
      icon: "favicon.png",
      image: "favicon.png", // Gambar besar (opsional)
      data: {
        url: "#/", // URL default jika tidak ada data
      },
    },
  };

  try {
    // Coba parse data payload dari server
    const payload = event.data.json();
    notificationData.title = payload.title || "Notifikasi Baru!";
    notificationData.options.body =
      payload.body || "Ada konten baru untuk Anda.";
    notificationData.options.icon = payload.icon || "favicon.png";
    notificationData.options.image = payload.image;
    notificationData.options.data.url = payload.data.url || "#/";
  } catch (e) {
    console.warn(
      "Push event data is not JSON, using default.",
      event.data.text()
    );
  }

  // Tampilkan notifikasi
  event.waitUntil(
    self.registration.showNotification(
      notificationData.title,
      notificationData.options
    )
  );
});

// Kriteria 2: Advanced (Menangani klik pada notifikasi)
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked.");

  const notification = event.notification;
  const urlToOpen = notification.data.url || "#/";

  // Tutup notifikasi
  notification.close();

  // Buka tab/jendela baru ke URL yang ditentukan
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientsArr) => {
      const hadClient = clientsArr.some((client) => {
        return client.url === urlToOpen && "focus" in client;
      });

      if (hadClient) {
        // Jika tab sudah terbuka, fokus ke tab itu
        clientsArr[0].focus();
      } else {
        // Jika tidak, buka tab baru
        clients.openWindow(urlToOpen);
      }
    })
  );
});
