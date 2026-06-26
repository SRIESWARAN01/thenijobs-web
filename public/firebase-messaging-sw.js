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
  const notificationTitle = payload.notification.title || 'THENIJOBS Update';
  const notificationOptions = {
    body: payload.notification.body || 'You have a new update.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
