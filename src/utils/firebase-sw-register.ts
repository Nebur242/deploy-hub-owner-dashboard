// Extend Window interface to include our custom property
declare global {
  interface Window {
    FIREBASE_CONFIG: Record<string, string | undefined>;
  }
}

/**
 * Registers the Firebase messaging service worker and passes configuration to it
 */
export async function registerFCMServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    console.warn("Service workers are not supported in this environment");
    return;
  }

  try {
    // Firebase config from environment variables
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_REST_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGE_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

    // Create a message channel to communicate with the service worker
    const messageChannel = new MessageChannel();

    // Register the service worker
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    console.log("Firebase messaging service worker registered");

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;

    // Pass Firebase config to the service worker
    if (registration.active) {
      // Make Firebase config available to the service worker
      navigator.serviceWorker.controller?.postMessage(
        {
          type: "FIREBASE_CONFIG",
          config: firebaseConfig,
        },
        [messageChannel.port2]
      );

      // Make config globally available to the service worker
      // This is used as a fallback in case message passing doesn't work
      window.FIREBASE_CONFIG = firebaseConfig;

      // Define a global setter for the service worker to access
      Object.defineProperty(window, "__FIREBASE_CONFIG__", {
        get: () => firebaseConfig,
        configurable: true,
      });
    }

    return registration;
  } catch (error) {
    console.error("Error registering Firebase service worker:", error);
    return null;
  }
}
