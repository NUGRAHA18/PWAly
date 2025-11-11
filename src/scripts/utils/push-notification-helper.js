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
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        NotificationHelper.showSuccess("Anda sudah berlangganan notifikasi.");
        console.log("User is already subscribed.");
        return;
      }

      const vapidPublicKey = CONFIG.PUSH_NOTIFICATION_VAPID_PUBLIC_KEY;
      if (
        !vapidPublicKey ||
        vapidPublicKey === "MASUKKAN_VAPID_PUBLIC_KEY_DARI_DICODING_DI_SINI"
      ) {
        console.error("VAPID Public Key not set in config.js");
        NotificationHelper.showError(
          "Konfigurasi notifikasi (VAPID key) belum diatur."
        );
        return;
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      console.log("Subscribing user...");
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      console.log("User subscribed:", subscription);
      NotificationHelper.showSuccess("Berhasil berlangganan notifikasi!");
    } catch (error) {
      console.error("Failed to subscribe:", error);
      NotificationHelper.showError(`Gagal berlangganan: ${error.message}`);
    }
  },

  // --- TAMBAHKAN FUNGSI INI ---
  // Fungsi ini yang dipanggil oleh tombol di header
  async handleSubscriptionToggle() {
    const permissionGranted = await this.askPermission();
    if (permissionGranted) {
      await this.subscribePush();
    }
  },
  // --- BATAS PENAMBAHAN ---
};

export default PushNotificationHelper;
