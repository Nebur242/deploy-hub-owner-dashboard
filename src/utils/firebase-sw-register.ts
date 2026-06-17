// Extend Window interface to include our custom property
declare global {
  interface Window {
    FIREBASE_CONFIG: Record<string, string | undefined>;
  }
}

let firebaseMessagingRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null =
  null;

function getFirebaseMessagingConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_REST_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGE_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

function hasRequiredFirebaseMessagingConfig(
  config: Record<string, string | undefined>,
) {
  return Boolean(
    config.apiKey &&
    config.projectId &&
    config.messagingSenderId &&
    config.appId,
  );
}

/**
 * Registers the Firebase messaging service worker and passes configuration to it
 */
export async function registerFCMServiceWorker() {
  if (
    globalThis.window === undefined ||
    !("serviceWorker" in globalThis.navigator)
  ) {
    console.warn("Service workers are not supported in this environment");
    return;
  }

  if (firebaseMessagingRegistrationPromise) {
    return firebaseMessagingRegistrationPromise;
  }

  firebaseMessagingRegistrationPromise = (async () => {
    try {
      const firebaseConfig = getFirebaseMessagingConfig();

      if (!hasRequiredFirebaseMessagingConfig(firebaseConfig)) {
        console.warn(
          "Skipping Firebase messaging service worker registration because config is incomplete",
        );
        return null;
      }

      const registration = await globalThis.navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
      );

      console.log("Firebase messaging service worker registered");

      await globalThis.navigator.serviceWorker.ready;

      const worker =
        registration.active || registration.waiting || registration.installing;

      globalThis.window.FIREBASE_CONFIG = firebaseConfig;

      Object.defineProperty(globalThis.window, "__FIREBASE_CONFIG__", {
        get: () => firebaseConfig,
        configurable: true,
      });

      worker?.postMessage({
        type: "FIREBASE_CONFIG",
        config: firebaseConfig,
      });

      return registration;
    } catch (error) {
      console.error("Error registering Firebase service worker:", error);
      firebaseMessagingRegistrationPromise = null;
      return null;
    }
  })();

  return firebaseMessagingRegistrationPromise;
}
