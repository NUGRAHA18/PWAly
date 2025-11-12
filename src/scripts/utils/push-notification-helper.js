import CONFIG from "../config";
import NotificationHelper from "./notification-helper";
import authRepository from "../data/auth-repository";

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const PushNotificationHelper = {
  isSupported() {
    return (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  },

  async askPermission() {
    if (!this.isSupported()) {
      NotificationHelper.showToast(
        "Browser tidak mendukung Push Notification.",
        "error"
      );
      return false;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission === "denied") {
        NotificationHelper.showToast(
          "Izin notifikasi ditolak. Silakan izinkan di pengaturan browser.",
          "error"
        );
        return false;
      }

      if (permission === "default") {
        NotificationHelper.showToast(
          "Anda menutup kotak izin notifikasi.",
          "warning"
        );
        return false;
      }

      console.log("✅ Permission granted");
      return true;
    } catch (error) {
      console.error("Error asking permission:", error);
      return false;
    }
  },

  async subscribePush() {
    if (!this.isSupported()) {
      NotificationHelper.showToast(
        "Browser tidak mendukung Push Notification.",
        "error"
      );
      return null;
    }

    try {
      console.log("⏳ Menunggu Service Worker...");
      const registration = await navigator.serviceWorker.ready;
      console.log("✅ Service Worker ready");

      // Cek subscription lama
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Subscribe baru
        const vapidPublicKey = CONFIG.PUSH_NOTIFICATION_VAPID_PUBLIC_KEY;
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        console.log("📤 Subscribing...");
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });

        console.log("✅ Browser subscription success!");
      }

      // ✅ KIRIM KE API DICODING
      const token = authRepository.getToken();
      if (!token) {
        NotificationHelper.showToast(
          "Anda harus login terlebih dahulu.",
          "error"
        );
        return null;
      }

      const subscriptionJSON = subscription.toJSON();

      console.log("📤 Sending subscription to Dicoding API...");
      const response = await fetch(
        `${CONFIG.BASE_URL}/v1/notifications/subscribe`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            endpoint: subscriptionJSON.endpoint,
            keys: {
              p256dh: subscriptionJSON.keys.p256dh,
              auth: subscriptionJSON.keys.auth,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Gagal subscribe ke server");
      }

      const data = await response.json();
      console.log("✅ Subscribe to Dicoding API success!", data);

      localStorage.setItem("push-notification-enabled", "true");
      localStorage.setItem(
        "push-subscription-endpoint",
        subscriptionJSON.endpoint
      );

      NotificationHelper.showToast(
        "Berhasil berlangganan notifikasi! 🔔",
        "success"
      );

      return subscription;
    } catch (error) {
      console.error("❌ Subscribe failed:", error);

      let errorMessage = "Gagal berlangganan notifikasi.";

      if (error.name === "NotAllowedError") {
        errorMessage = "Permission ditolak.";
      } else if (error.name === "AbortError") {
        errorMessage = "Subscribe dibatalkan.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      NotificationHelper.showToast(errorMessage, "error");
      return null;
    }
  },

  async unsubscribePush() {
    if (!this.isSupported()) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        NotificationHelper.showToast(
          "Anda belum berlangganan notifikasi.",
          "info"
        );
        return false;
      }

      // ✅ UNSUBSCRIBE DARI API DICODING
      const token = authRepository.getToken();
      if (token) {
        const subscriptionJSON = subscription.toJSON();

        console.log("📤 Unsubscribing from Dicoding API...");
        const response = await fetch(
          `${CONFIG.BASE_URL}/v1/notifications/subscribe`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              endpoint: subscriptionJSON.endpoint,
            }),
          }
        );

        if (response.ok) {
          console.log("✅ Unsubscribe from Dicoding API success");
        }
      }

      // Unsubscribe dari browser
      const success = await subscription.unsubscribe();

      if (success) {
        console.log("✅ Browser unsubscribe success");
        localStorage.setItem("push-notification-enabled", "false");
        localStorage.removeItem("push-subscription-endpoint");
        NotificationHelper.showToast(
          "Berhasil berhenti berlangganan notifikasi.",
          "success"
        );
        return true;
      } else {
        NotificationHelper.showToast("Gagal berhenti berlangganan.", "error");
        return false;
      }
    } catch (error) {
      console.error("Error unsubscribing:", error);
      NotificationHelper.showToast("Gagal berhenti berlangganan.", "error");
      return false;
    }
  },

  async isSubscribed() {
    if (!this.isSupported()) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error("Error checking subscription:", error);
      return false;
    }
  },

  async handleSubscriptionToggle() {
    const isSubscribed = await this.isSubscribed();

    if (isSubscribed) {
      await this.unsubscribePush();
    } else {
      const permissionGranted = await this.askPermission();
      if (permissionGranted) {
        await this.subscribePush();
      }
    }

    this.updateToggleButton();
  },

  async updateToggleButton() {
    const button = document.getElementById("notification-toggle");
    if (!button) return;

    const isSubscribed = await this.isSubscribed();

    if (isSubscribed) {
      button.textContent = "🔔";
      button.title = "Notifikasi Aktif (klik untuk nonaktifkan)";
      button.setAttribute("aria-label", "Matikan notifikasi");
    } else {
      button.textContent = "🔕";
      button.title = "Notifikasi Nonaktif (klik untuk aktifkan)";
      button.setAttribute("aria-label", "Nyalakan notifikasi");
    }
  },

  async sendTestNotification() {
    if (!this.isSupported()) {
      NotificationHelper.showToast(
        "Browser tidak mendukung notifikasi.",
        "error"
      );
      return;
    }

    if (Notification.permission !== "granted") {
      const granted = await this.askPermission();
      if (!granted) return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      await registration.showNotification("StoryShare - Test Notifikasi 🧪", {
        body: "Ini adalah test notifikasi lokal. Notifikasi berfungsi dengan baik!",
        icon: "/favicon.png",
        badge: "/favicon.png",
        tag: "test-notification",
        actions: [
          { action: "view", title: "Lihat", icon: "/favicon.png" },
          { action: "close", title: "Tutup" },
        ],
        data: { url: "/" },
      });

      console.log("✅ Test notification sent");
      NotificationHelper.showToast("Test notifikasi berhasil!", "success");
    } catch (error) {
      console.error("Error sending test notification:", error);
      NotificationHelper.showToast("Gagal mengirim test notifikasi.", "error");
    }
  },
};

export default PushNotificationHelper;
