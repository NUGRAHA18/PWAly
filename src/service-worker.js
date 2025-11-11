self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
});

self.addEventListener("fetch", (event) => {
  // console.log('Service Worker: Fetching', event.request.url);
  // Logika caching akan ditambahkan di sini
});

// --- Kriteria 2: Menerapkan Push Notification ---

// Kriteria 2 (Basic & Skilled): Menampilkan notifikasi dinamis
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push Received.");

  let notificationData = {
    title: "StoryShare",
    options: {
      body: "Ada cerita baru yang diunggah!",
      icon: "favicon.png", // Ikon default
      data: {
        url: "#/", // URL default
      },
    },
  };

  try {
    // Kriteria 2 (Skilled): Membaca data dinamis dari payload
    const payload = event.data.json();
    notificationData.title = payload.title || "StoryShare";
    notificationData.options.body = payload.body || "Ada cerita baru!";
    notificationData.options.icon = payload.icon || "favicon.png";
    notificationData.options.data.url = payload.url || "#/";
  } catch (e) {
    console.warn(
      "Push event payload is not JSON, using default.",
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

// Kriteria 2 (Advanced): Menambahkan action klik
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked.");

  const notification = event.notification;
  const urlToOpen = notification.data.url || "#/";

  // Tutup notifikasi setelah di-klik
  notification.close();

  // Buka tab/jendela baru ke URL yang ditentukan
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientsArr) => {
        // Cek apakah tab dengan URL yang sama sudah terbuka
        const hadClient = clientsArr.some((client) => {
          return new URL(client.url).hash === urlToOpen && "focus" in client;
        });

        if (hadClient) {
          // Jika tab sudah terbuka, fokus ke tab itu
          const existingClient = clientsArr.find(
            (client) => new URL(client.url).hash === urlToOpen
          );
          if (existingClient) {
            existingClient.focus();
          } else {
            clients.openWindow(urlToOpen);
          }
        } else {
          // Jika tidak, buka tab baru
          clients.openWindow(urlToOpen);
        }
      })
  );
});
