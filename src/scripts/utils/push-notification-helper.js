import CONFIG from "../config";
import NotificationHelper from "./notification-helper";

// Helper function untuk mengubah VAPID key
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
  async askPermission() {
    try {
      const permissionResult = await Notification.requestPermission();
      if (permissionResult === "denied") {
        NotificationHelper.showToast(
          "Anda memblokir izin notifikasi.",
          "error"
        );
        return false;
      }

      if (permissionResult === "default") {
        NotificationHelper.showToast(
          "Anda menutup kotak izin notifikasi.",
          "warning"
        );
        return false;
      }

      console.log("Notification permission granted.");
      return true;
    } catch (error) {
      console.error("Error asking permission:", error);
      return false;
    }
  },

  async subscribePush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      NotificationHelper.showToast(
        "Browser Anda tidak mendukung Push Notification.",
        "error"
      );
      return;
    }

    try {
      console.log("Waiting for service worker...");
      const registration = await navigator.serviceWorker.ready;
      console.log("✅ Service worker ready");

      let subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        NotificationHelper.showToast(
          "Anda sudah berlangganan notifikasi.",
          "success"
        );
        console.log("User is already subscribed:", subscription);
        return;
      }

      const vapidPublicKey = CONFIG.PUSH_NOTIFICATION_VAPID_PUBLIC_KEY;

      console.log("VAPID Key:", vapidPublicKey);
      console.log(
        "VAPID Key length:",
        vapidPublicKey ? vapidPublicKey.length : 0
      );

      if (!vapidPublicKey) {
        console.error("❌ VAPID Public Key is empty");
        NotificationHelper.showToast(
          "Konfigurasi notifikasi (VAPID key) belum diatur.",
          "error"
        );
        return;
      }

      if (vapidPublicKey.length < 85 || vapidPublicKey.length > 90) {
        console.error("❌ VAPID Key length invalid:", vapidPublicKey.length);
        NotificationHelper.showToast(
          "VAPID key tidak valid. Panjang key: " + vapidPublicKey.length,
          "error"
        );
        return;
      }

      let convertedVapidKey;
      try {
        convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        console.log(
          "✅ VAPID key converted, length:",
          convertedVapidKey.length
        );
      } catch (conversionError) {
        console.error("❌ Failed to convert VAPID key:", conversionError);
        NotificationHelper.showToast(
          "Gagal mengonversi VAPID key: " + conversionError.message,
          "error"
        );
        return;
      }

      console.log("Subscribing user...");

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      console.log("✅ User subscribed:", subscription);
      console.log("Subscription endpoint:", subscription.endpoint);

      NotificationHelper.showToast(
        "Berhasil berlangganan notifikasi!",
        "success"
      );
    } catch (error) {
      console.error("❌ Failed to subscribe:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);

      if (error.name === "InvalidAccessError") {
        NotificationHelper.showToast(
          "VAPID key tidak valid. Pastikan menggunakan key dari Dicoding yang benar.",
          "error"
        );
      } else if (error.name === "NotAllowedError") {
        NotificationHelper.showToast(
          "Permission ditolak. Izinkan notifikasi di browser settings.",
          "error"
        );
      } else if (error.name === "AbortError") {
        NotificationHelper.showToast(
          "Subscription dibatalkan. Coba lagi.",
          "warning"
        );
      } else {
        NotificationHelper.showToast(
          `Gagal berlangganan: ${error.message || error.name}`,
          "error"
        );
      }
    }
  },

  async handleSubscriptionToggle() {
    const permissionGranted = await this.askPermission();
    if (permissionGranted) {
      await this.subscribePush();
    }
  },
};

export default PushNotificationHelper;
