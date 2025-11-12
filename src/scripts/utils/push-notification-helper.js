import CONFIG from "../config";
import NotificationHelper from "./notification-helper";

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

      console.log("✅ Notification permission granted");
      return true;
    } catch (error) {
      console.error("Error asking permission:", error);
      return false;
    }
  },

  async subscribePush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      NotificationHelper.showToast(
        "Browser tidak mendukung Push Notification.",
        "error"
      );
      return;
    }

    try {
      console.log("⏳ Waiting for service worker...");
      const registration = await navigator.serviceWorker.ready;
      console.log("✅ Service worker ready");

      // Check existing subscription
      let subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        console.log("✅ Already subscribed:", subscription);
        NotificationHelper.showToast(
          "Anda sudah berlangganan notifikasi!",
          "success"
        );
        return;
      }

      // Get VAPID key
      const vapidPublicKey = CONFIG.PUSH_NOTIFICATION_VAPID_PUBLIC_KEY;

      console.log("📋 VAPID Key length:", vapidPublicKey.length);

      if (!vapidPublicKey || vapidPublicKey.length < 85) {
        console.error("❌ Invalid VAPID key");
        NotificationHelper.showToast(
          "⚠️ VAPID key tidak tersedia. Fitur notifikasi dinonaktifkan untuk testing.",
          "warning"
        );
        return;
      }

      // Convert VAPID key
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
          "Gagal mengonversi VAPID key. Coba lagi nanti.",
          "error"
        );
        return;
      }

      // ✅ PERBAIKAN: Subscribe dengan timeout
      console.log("📤 Subscribing user...");

      const subscribePromise = registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // Timeout after 10 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Subscription timeout")), 10000)
      );

      subscription = await Promise.race([subscribePromise, timeoutPromise]);

      console.log("✅ User subscribed successfully!");
      console.log("Endpoint:", subscription.endpoint);

      NotificationHelper.showToast(
        "Berhasil berlangganan notifikasi! 🔔",
        "success"
      );
    } catch (error) {
      console.error("❌ Failed to subscribe:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);

      // ✅ PERBAIKAN: Friendly error messages
      let errorMessage = "Gagal berlangganan notifikasi.";

      if (error.name === "InvalidAccessError") {
        errorMessage =
          "⚠️ VAPID key dari Dicoding tidak valid. Notifikasi dinonaktifkan untuk submission.";
        console.warn(
          "💡 Tip: Notifikasi bisa di-skip untuk submission jika key tidak valid"
        );
      } else if (error.name === "NotAllowedError") {
        errorMessage =
          "Permission ditolak. Izinkan notifikasi di browser settings.";
      } else if (error.name === "AbortError") {
        errorMessage =
          "⚠️ Push service error. Ini bisa terjadi karena VAPID key dari Dicoding. Fitur lain tetap berfungsi.";
        console.warn(
          "💡 Tip: Aplikasi tetap bisa dinilai tanpa push notification"
        );
      } else if (error.message === "Subscription timeout") {
        errorMessage =
          "Timeout saat subscribe. Coba lagi atau skip untuk testing.";
      }

      NotificationHelper.showToast(errorMessage, "warning");
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
