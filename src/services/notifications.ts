import {
  getMessaging,
  getToken,
  Messaging,
  onMessage,
} from "firebase/messaging";
import app from "@/config/firebase";
import { authService } from "./auth-service";

// Store for our FCM token
const FCM_TOKEN_KEY = "fcm_token";

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
      if (typeof window !== "undefined") {
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
        }`
      );
      return permission === "granted";
    } catch (error) {
      console.error("❌ Error requesting notification permission:", error);
      return false;
    }
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

      // Request notification permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.warn("⚠️ Notification permission not granted");
        return null;
      }

      // Get the FCM token
      console.log("🔄 Getting FCM token...");
      const currentToken = await getToken(this.messaging, {
        vapidKey,
      });

      if (currentToken) {
        console.log(
          "✅ FCM token obtained:",
          currentToken.substring(0, 10) + "..."
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
        }
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
        window.dispatchEvent(event);

        // Display a native browser notification if the browser supports it
        if (Notification.permission === "granted") {
          const title = notification.title || "New Notification";
          const options = {
            body: notification.body,
            icon: "/favicon.png", // Use your app's favicon or logo
            badge: "/favicon.png",
            data: payload.data,
            timestamp: new Date().getTime(),
          };

          const browserNotification = new Notification(title, options);

          // Handle click on notification
          browserNotification.onclick = () => {
            console.log("🖱️ Notification clicked");
            window.focus();
            browserNotification.close();

            // Handle routing based on notification data
            if (payload.data?.url) {
              console.log("🔗 Navigating to:", payload.data.url);
              window.location.href = payload.data.url;
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
