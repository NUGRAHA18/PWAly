import CONFIG from "../config";
import NotificationHelper from "./notification-helper";
import authModel from "../models/auth-model"; // ✅ Standar dan konsisten

const VAPID_PUBLIC_KEY =
  "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";
const API_NOTIFICATIONS_PATH = `${CONFIG.BASE_URL}/notifications/subscribe`;
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

      console.log("✅ Notification permission granted.");
      return true;
    } catch (error) {
      console.error("Error asking permission:", error);
      return false;
    }
  },

  async _registerSubscriptionWithServer(subscription) {
    const token = authModel.getToken();
    if (!token) {
      NotificationHelper.showToast(
        "Gagal: Anda harus login untuk berlangganan notifikasi.",
        "error"
      );
      return false;
    }

    const key = subscription.toJSON().keys;
    const payload = {
      endpoint: subscription.endpoint,
      p256dh: key.p256dh,
      auth: key.auth,
    };

    try {
      const response = await fetch(API_NOTIFICATIONS_PATH, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: "Server error or invalid response.",
        }));
        console.error("Server push registration failed:", errorData);
        return false;
      }

      console.log("✅ Subscription registered with Dicoding server.");
      return true;
    } catch (error) {
      console.error("Network error registering subscription:", error);
      return false;
    }
  },

  async unsubscribePush() {
    const token = authModel.getToken();
    if (!token) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) return;

      const endpoint = subscription.endpoint;

      const response = await fetch(API_NOTIFICATIONS_PATH, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ endpoint }),
      });

      if (!response.ok) {
        console.error("Server unsubscribe failed.");
      }

      const unsubscribed = await subscription.unsubscribe();

      if (unsubscribed) {
        NotificationHelper.showToast(
          "Berhenti berlangganan notifikasi.",
          "info"
        );
      } else {
        NotificationHelper.showToast(
          "Gagal menghapus langganan browser.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error during unsubscribe:", error);
      NotificationHelper.showError(
        "Terjadi kesalahan saat berhenti berlangganan."
      );
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
      console.log("⏳ Waiting for service worker...");
      const registration = await navigator.serviceWorker.ready;
      console.log("✅ Service worker ready");

      let subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const isRegistered = await this._registerSubscriptionWithServer(
          subscription
        );
        if (isRegistered) {
          NotificationHelper.showToast(
            "Anda sudah berlangganan notifikasi.",
            "success"
          );
          return;
        }

        await subscription.unsubscribe();
        subscription = null;
        console.log(
          "Langganan browser lama dibatalkan karena gagal registrasi ulang."
        );
      }

      const vapidPublicKey = VAPID_PUBLIC_KEY;
      console.log("VAPID Key:", vapidPublicKey);

      if (!vapidPublicKey) {
        NotificationHelper.showToast(
          "Konfigurasi VAPID key belum diatur.",
          "error"
        );
        return;
      }

      if (vapidPublicKey.length < 85 || vapidPublicKey.length > 90) {
        NotificationHelper.showToast(
          `VAPID key tidak valid. Panjang key: ${vapidPublicKey.length}`,
          "error"
        );
        return;
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      const successServer = await this._registerSubscriptionWithServer(
        subscription
      );
      if (successServer) {
        NotificationHelper.showToast(
          "Berhasil berlangganan notifikasi!",
          "success"
        );
      } else {
        await subscription.unsubscribe();
        NotificationHelper.showToast(
          "Gagal mendaftar langganan di server Dicoding.",
          "error"
        );
      }
    } catch (error) {
      console.error("❌ Failed to subscribe:", error);

      if (
        error.name === "InvalidAccessError" ||
        (error.name === "AbortError" &&
          error.message.includes("push service error"))
      ) {
        NotificationHelper.showToast(
          "VAPID key mungkin tidak valid atau expired. Silakan periksa file config.",
          "error"
        );
      } else if (error.name === "NotAllowedError") {
        NotificationHelper.showToast(
          "Akses notifikasi ditolak di browser.",
          "error"
        );
      } else if (error.name === "AbortError") {
        NotificationHelper.showToast(
          "Subscription dibatalkan. Coba lagi.",
          "warning"
        );
      } else {
        NotificationHelper.showToast(
          `Gagal berlangganan: ${error.message}`,
          "error"
        );
      }
    }
  },

  async handleSubscriptionToggle() {
    const permissionGranted = await this.askPermission();
    if (!permissionGranted) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await this.unsubscribePush();
    } else {
      await this.subscribePush();
    }
  },
};

export default PushNotificationHelper;
