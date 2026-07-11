// Scripts for firebase app and messaging
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyAAXHgdvKXi4pFPNGciMbZE8lPITN9Hsug",
  authDomain: "thenijobs-9f01d.firebaseapp.com",
  projectId: "thenijobs-9f01d",
  storageBucket: "thenijobs-9f01d.firebasestorage.app",
  messagingSenderId: "1057136000588",
  appId: "1:1057136000588:web:12506f87f1f502596a7ee9"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);
  const notificationTitle = payload.notification?.title || 'THENIJOBS Update';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new update.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.data?.tag || 'thenijobs-general',
    data: {
      url: payload.data?.url || '/',
      ...payload.data,
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click — open the URL from notification data
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a tab with this URL is already open, focus it
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new tab
      return clients.openWindow(url);
    })
  );
});

// Simple fetch event listener to ensure compliance with PWA installability requirements
self.addEventListener('fetch', (event) => {
  // Serves as a placeholder fetch handler for PWA requirements
});

