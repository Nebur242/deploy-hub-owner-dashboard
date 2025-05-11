// Create a variable to store Firebase config
self.FIREBASE_CONFIG = null;

// Listen for messages from the main application
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "FIREBASE_CONFIG") {
    self.FIREBASE_CONFIG = event.data.config;
    console.log("[firebase-messaging-sw.js] 📝 Received Firebase config");
    initializeFirebase();
  }
});

// Try to get config from global window object
self.addEventListener("install", () => {
  console.log("[firebase-messaging-sw.js] ⚙️ Service worker installed");

  // Connect to clients to get config
  self.clients.matchAll().then((clients) => {
    if (clients && clients.length) {
      console.log(
        "[firebase-messaging-sw.js] 🔍 Found clients, requesting config"
      );
      for (const client of clients) {
        client.postMessage({ type: "GET_FIREBASE_CONFIG" });
      }
    }
  });

  // Activate immediately
  self.skipWaiting();
});

// Activate immediately when installed
self.addEventListener("activate", (event) => {
  console.log("[firebase-messaging-sw.js] 🚀 Service worker activated");

  event.waitUntil(self.clients.claim());

  // Try to initialize if we already have config
  if (self.FIREBASE_CONFIG) {
    initializeFirebase();
  }
});

// Function to initialize Firebase
function initializeFirebase() {
  if (!self.firebase || !self.FIREBASE_CONFIG) {
    console.log(
      "[firebase-messaging-sw.js] ⚠️ Firebase or config not available yet"
    );
    return;
  }

  try {
    console.log("[firebase-messaging-sw.js] 🔧 Initializing Firebase");

    // Initialize the Firebase app in the service worker
    firebase.initializeApp({
      apiKey: self.FIREBASE_CONFIG.apiKey,
      authDomain: self.FIREBASE_CONFIG.authDomain,
      projectId: self.FIREBASE_CONFIG.projectId,
      storageBucket: self.FIREBASE_CONFIG.storageBucket,
      messagingSenderId: self.FIREBASE_CONFIG.messagingSenderId,
      appId: self.FIREBASE_CONFIG.appId,
      measurementId: self.FIREBASE_CONFIG.measurementId,
    });

    // Retrieve an instance of Firebase Messaging so that it can handle background messages.
    const messaging = firebase.messaging();

    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
      const timestamp = new Date().toLocaleTimeString();

      console.group(
        "[firebase-messaging-sw.js] 📬 BACKGROUND NOTIFICATION RECEIVED"
      );
      console.log("⏰ Time:", timestamp);
      console.log("📋 Title:", payload.notification?.title);
      console.log("📄 Body:", payload.notification?.body);
      console.log("📎 Data:", payload.data);
      console.log("📦 Full payload:", payload);
      console.groupEnd();

      const notificationTitle =
        payload.notification?.title || "Background Message";
      const notificationOptions = {
        body: payload.notification?.body || "",
        icon: "/favicon.png",
        badge: "/favicon.png",
        data: payload.data,
        tag: "notification-" + Date.now(), // Make each notification unique
        timestamp: Date.now(),
      };

      // Show notification
      return self.registration.showNotification(
        notificationTitle,
        notificationOptions
      );
    });

    console.log(
      "[firebase-messaging-sw.js] ✅ Firebase initialized successfully"
    );
  } catch (error) {
    console.error(
      "[firebase-messaging-sw.js] ❌ Firebase initialization error:",
      error
    );
  }
}

// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

// Try to initialize if we already have config
if (self.FIREBASE_CONFIG) {
  initializeFirebase();
}

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.group("[firebase-messaging-sw.js] 🖱️ Notification clicked");
  console.log("📋 Notification:", event.notification);
  console.log("🔍 Notification action:", event.action);
  console.log("📎 Notification data:", event.notification.data);
  console.groupEnd();

  event.notification.close();

  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Get notification data
        const urlToOpen =
          event.notification.data?.url || "/dashboard/notifications";
        console.log(
          "[firebase-messaging-sw.js] 🔗 Attempting to navigate to:",
          urlToOpen
        );

        // Check if there's already an open window
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && "focus" in client) {
            console.log(
              "[firebase-messaging-sw.js] 🔍 Found existing client, focusing"
            );
            return client.focus();
          }
        }

        // If no open window, open a new one
        if (clients.openWindow) {
          console.log(
            "[firebase-messaging-sw.js] 🔍 No existing client found, opening new window"
          );
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
