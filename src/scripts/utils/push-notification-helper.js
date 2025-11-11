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
        console.error("Notification permission denied.");
        NotificationHelper.showError("Anda memblokir izin notifikasi.");
        return;
      }

      if (permissionResult === "default") {
        console.warn("Notification permission dismissed.");
        return;
      }

      console.log("Notification permission granted.");
      // Langsung subscribe setelah izin diberikan
      await this.subscribePush();
    } catch (error) {
      console.error("Error asking permission:", error);
    }
  },

  async subscribePush() {
    if (!("serviceWorker" in navigator)) {
      console.error("Service Worker not supported in this browser.");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription =
        await registration.pushManager.getSubscription();

      if (existingSubscription) {
        console.log("User is already subscribed.");
        NotificationHelper.showSuccess("Anda sudah berlangganan notifikasi.");
        return;
      }

      const vapidPublicKey = CONFIG.PUSH_NOTIFICATION_VAPID_PUBLIC_KEY;
      if (
        !vapidPublicKey ||
        vapidPublicKey === "MASUKKAN_PUBLIC_KEY_ANDA_DI_SINI"
      ) {
        console.error("VAPID Public Key not set in config.js");
        NotificationHelper.showError(
          "Konfigurasi notifikasi (VAPID key) belum diatur."
        );
        return;
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      console.log("User subscribed:", subscription);
      NotificationHelper.showSuccess("Berhasil berlangganan notifikasi!");

      // PENTING: Kirim 'subscription' (JSON) ini ke backend Anda untuk disimpan
      // await YourApi.saveSubscription(subscription);
    } catch (error) {
      console.error("Failed to subscribe:", error);
      NotificationHelper.showError(`Gagal berlangganan: ${error.message}`);
    }
  },
};

export default PushNotificationHelper;
