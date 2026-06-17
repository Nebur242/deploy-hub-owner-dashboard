import {
  getMessaging,
  getToken,
  Messaging,
  onMessage,
} from "firebase/messaging";
import app from "@/config/firebase";
import { authService } from "./auth-service";
import { registerFCMServiceWorker } from "@/utils/firebase-sw-register";

// Store for our FCM token
const FCM_TOKEN_KEY = "fcm_token";
const FCM_PUSH_PERMISSION_DENIED_KEY = "fcm_push_permission_denied";

function isPushPermissionDeniedError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const errorName = error.name.toLowerCase();
  const errorMessage = error.message.toLowerCase();

  return (
    errorName === "aborterror" ||
    errorName === "notallowederror" ||
    errorMessage.includes("permission denied") ||
    errorMessage.includes("registration failed")
  );
}

/**
 * Firebase Cloud Messaging Service for push notifications
 */
class NotificationService {
  private messaging: Messaging | null = null;

  /**
   * Initialize the messaging service - must be called in browser environment
   */
  initialize() {
    try {
      if (globalThis.window !== undefined) {
        this.messaging = getMessaging(app);
        console.log("📱 Firebase Cloud Messaging initialized");
        this.onMessage();
      }
    } catch (error) {
      console.error("❌ Failed to initialize Firebase Cloud Messaging:", error);
    }
  }

  /**
   * Request permission for notifications
   * @returns Promise<boolean> - whether permission was granted
   */
  async requestPermission(): Promise<boolean> {
    try {
      console.log("🔔 Requesting notification permission...");
      const permission = await Notification.requestPermission();
      console.log(
        `🔔 Notification permission ${
          permission === "granted" ? "granted ✅" : "denied ❌"
        }`,
      );

      if (permission === "granted") {
        sessionStorage.removeItem(FCM_PUSH_PERMISSION_DENIED_KEY);
      }

      return permission === "granted";
    } catch (error) {
      console.error("❌ Error requesting notification permission:", error);
      return false;
    }
  }

  private async canSubscribeToPush(
    serviceWorkerRegistration: ServiceWorkerRegistration,
    forceRefresh: boolean,
  ): Promise<boolean> {
    if (
      !forceRefresh &&
      sessionStorage.getItem(FCM_PUSH_PERMISSION_DENIED_KEY) === "true"
    ) {
      console.warn(
        "⚠️ Skipping FCM token registration because push permission was denied earlier in this session",
      );
      return false;
    }

    if (!("PushManager" in globalThis.window)) {
      console.warn("⚠️ Push messaging is not supported in this browser");
      return false;
    }

    if (
      typeof serviceWorkerRegistration.pushManager.permissionState !==
      "function"
    ) {
      return true;
    }

    const permissionState =
      await serviceWorkerRegistration.pushManager.permissionState({
        userVisibleOnly: true,
      });

    if (permissionState === "denied") {
      sessionStorage.setItem(FCM_PUSH_PERMISSION_DENIED_KEY, "true");
      console.warn(
        "⚠️ Push subscription is denied at the browser level, skipping FCM token registration",
      );
      return false;
    }

    return true;
  }

  /**
   * Get FCM token for the current user
   * @param forceRefresh - Whether to force a new token
   * @returns Promise<string|null> - The FCM token
   */
  async getToken(forceRefresh: boolean = false): Promise<string | null> {
    try {
      // Get the current FCM token if it exists and we're not forcing a refresh
      if (!forceRefresh) {
        const existingToken = localStorage.getItem(FCM_TOKEN_KEY);
        if (existingToken) {
          console.log("🔑 Using existing FCM token");
          return existingToken;
        }
      }

      // Check if we have initialited Firebase messaging
      if (!this.messaging) {
        this.initialize();
        if (!this.messaging) return null;
      }

      // Get VAPID key for web push
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.warn(
          "⚠️ Missing Firebase VAPID key, skipping FCM token registration",
        );
        return null;
      }

      const serviceWorkerRegistration = await registerFCMServiceWorker();
      if (!serviceWorkerRegistration) {
        console.warn(
          "⚠️ Firebase messaging service worker is not ready, skipping FCM token registration",
        );
        return null;
      }

      // Request notification permission
      const hasPermission =
        Notification.permission === "granted"
          ? true
          : await this.requestPermission();
      if (!hasPermission) {
        console.warn("⚠️ Notification permission not granted");
        return null;
      }

      const canSubscribeToPush = await this.canSubscribeToPush(
        serviceWorkerRegistration,
        forceRefresh,
      );

      if (!canSubscribeToPush) {
        return null;
      }

      // Get the FCM token
      console.log("🔄 Getting FCM token...");
      const currentToken = await getToken(this.messaging, {
        vapidKey,
        serviceWorkerRegistration,
      });

      if (currentToken) {
        console.log(
          "✅ FCM token obtained:",
          currentToken.substring(0, 10) + "...",
        );
        // Store the token in localStorage
        localStorage.setItem(FCM_TOKEN_KEY, currentToken);
        // Register this device for the current user on the backend
        await this.registerTokenWithBackend(currentToken);
        return currentToken;
      } else {
        console.warn("⚠️ No FCM token available");
        return null;
      }
    } catch (error) {
      if (isPushPermissionDeniedError(error)) {
        sessionStorage.setItem(FCM_PUSH_PERMISSION_DENIED_KEY, "true");
        console.warn(
          "⚠️ Browser denied push subscription, skipping FCM token registration for this session",
        );
        return null;
      }

      console.error("❌ Error getting FCM token:", error);
      return null;
    }
  }

  /**
   * Register the FCM token with the backend for the current user
   * @param token - The FCM token to register
   */
  private async registerTokenWithBackend(token: string): Promise<void> {
    try {
      // Get authorization token
      const authToken = await authService.getToken();
      if (!authToken) throw new Error("User not authenticated");

      console.log("📤 Sending FCM token to backend for registration");
      // Send the token to the backend with info about the device
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tokens`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            token,
            deviceInfo: {
              platform: "web",
              browser: navigator.userAgent,
              language: navigator.language,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to register device token with backend");
      }

      console.log("✅ FCM token registered with backend successfully");
    } catch (error) {
      console.error("❌ Error registering FCM token with backend:", error);
    }
  }

  /**
   * Handle incoming messages when the app is in the foreground
   */
  private onMessage(): void {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.group("📬 Push Notification Received (Foreground)");
      console.log("Time:", new Date().toLocaleTimeString());
      console.log("Title:", payload.notification?.title);
      console.log("Body:", payload.notification?.body);
      console.log("Data:", payload.data);
      console.log("Full payload:", payload);
      console.groupEnd();

      const { notification } = payload;
      if (notification) {
        // Create and dispatch a custom event that our app can listen for
        const event = new CustomEvent("fcm-notification", {
          detail: {
            title: notification.title,
            body: notification.body,
            data: payload.data || {},
            timestamp: new Date().toISOString(),
          },
        });
        globalThis.window.dispatchEvent(event);

        // Display a native browser notification if the browser supports it
        if (Notification.permission === "granted") {
          const title = notification.title || "New Notification";
          const options = {
            body: notification.body,
            icon: "/favicon.png", // Use your app's favicon or logo
            badge: "/favicon.png",
            data: payload.data,
            timestamp: Date.now(),
          };

          const browserNotification = new Notification(title, options);

          // Handle click on notification
          browserNotification.onclick = () => {
            console.log("🖱️ Notification clicked");
            globalThis.window.focus();
            browserNotification.close();

            // Handle routing based on notification data
            if (payload.data?.url) {
              console.log("🔗 Navigating to:", payload.data.url);
              globalThis.window.location.href = payload.data.url;
            }
          };
        }
      }
    });
  }

  /**
   * Unregister the current FCM token
   */
  async unregisterToken(): Promise<void> {
    try {
      const token = localStorage.getItem(FCM_TOKEN_KEY);
      if (!token) return;

      // Get authorization token
      const authToken = await authService.getToken();
      if (!authToken) throw new Error("User not authenticated");

      console.log("🗑️ Unregistering FCM token");
      // Send request to backend to unregister this token
      const response = await fetch("/api/notifications/unregister-device", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error("Failed to unregister device token with backend");
      }

      // Remove token from localStorage
      localStorage.removeItem(FCM_TOKEN_KEY);
      console.log("✅ FCM token unregistered successfully");
    } catch (error) {
      console.error("❌ Error unregistering FCM token:", error);
    }
  }
}

// Export as singleton instance
export const notificationService = new NotificationService();
