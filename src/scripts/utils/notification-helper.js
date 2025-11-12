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
        NotificationHelper.showError("Anda memblokir izin notifikasi.");
        return false;
      }

      if (permissionResult === "default") {
        NotificationHelper.showError("Anda menutup kotak izin notifikasi.");
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
      NotificationHelper.showError(
        "Browser Anda tidak mendukung Push Notification."
      );
      return;
    }

    try {
      // ✅ PERBAIKAN: Tunggu service worker ready
      console.log("Waiting for service worker...");
      const registration = await navigator.serviceWorker.ready;
      console.log("✅ Service worker ready");

      let subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        NotificationHelper.showSuccess("Anda sudah berlangganan notifikasi.");
        console.log("User is already subscribed:", subscription);
        return;
      }

      // ✅ PERBAIKAN: Validasi VAPID key
      const vapidPublicKey = CONFIG.PUSH_NOTIFICATION_VAPID_PUBLIC_KEY;

      console.log("VAPID Key:", vapidPublicKey);
      console.log(
        "VAPID Key length:",
        vapidPublicKey ? vapidPublicKey.length : 0
      );

      if (!vapidPublicKey) {
        console.error("❌ VAPID Public Key is empty");
        NotificationHelper.showError(
          "Konfigurasi notifikasi (VAPID key) belum diatur."
        );
        return;
      }

      // ✅ PERBAIKAN: Cek panjang key (should be 87-88 characters)
      if (vapidPublicKey.length < 85 || vapidPublicKey.length > 90) {
        console.error("❌ VAPID Key length invalid:", vapidPublicKey.length);
        NotificationHelper.showError(
          "VAPID key tidak valid. Panjang key: " + vapidPublicKey.length
        );
        return;
      }

      // ✅ PERBAIKAN: Try-catch untuk konversi key
      let convertedVapidKey;
      try {
        convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        console.log(
          "✅ VAPID key converted, length:",
          convertedVapidKey.length
        );
      } catch (conversionError) {
        console.error("❌ Failed to convert VAPID key:", conversionError);
        NotificationHelper.showError(
          "Gagal mengonversi VAPID key: " + conversionError.message
        );
        return;
      }

      console.log("Subscribing user...");

      // ✅ PERBAIKAN: Subscribe dengan error handling lebih baik
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      console.log("✅ User subscribed:", subscription);
      console.log("Subscription endpoint:", subscription.endpoint);

      NotificationHelper.showSuccess("Berhasil berlangganan notifikasi!");
    } catch (error) {
      console.error("❌ Failed to subscribe:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);

      // ✅ PERBAIKAN: Error messages yang lebih spesifik
      if (error.name === "InvalidAccessError") {
        NotificationHelper.showError(
          "VAPID key tidak valid. Pastikan menggunakan key dari Dicoding yang benar."
        );
      } else if (error.name === "NotAllowedError") {
        NotificationHelper.showError(
          "Permission ditolak. Izinkan notifikasi di browser settings."
        );
      } else if (error.name === "AbortError") {
        NotificationHelper.showError("Subscription dibatalkan. Coba lagi.");
      } else {
        NotificationHelper.showError(
          `Gagal berlangganan: ${error.message || error.name}`
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
