// Firebase Cloud Messaging Service Worker
// This runs in the background to receive push notifications

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize Firebase in Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyBYddCdbD2MGG4Z56AR15UjVlkrMR64q4o",
  authDomain: "marjstation-49e10.firebaseapp.com",
  databaseURL: "https://marjstation-49e10-default-rtdb.firebaseio.com",
  projectId: "marjstation-49e10",
  storageBucket: "marjstation-49e10.firebasestorage.app",
  messagingSenderId: "838144781266",
  appId: "1:838144781266:web:94bb3df0c4f0c79122b60b",
  measurementId: "G-2XWHBBZQR3"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'HungerStation';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new notification',
    icon: payload.notification?.icon || '/logo192.png',
    badge: '/logo192.png',
    tag: payload.data?.tag || 'default',
    data: payload.data || {},
    actions: getNotificationActions(payload.data?.type),
    requireInteraction: payload.data?.requireInteraction === 'true',
    vibrate: [200, 100, 200]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Get notification actions based on type
function getNotificationActions(type) {
  switch (type) {
    case 'new_order':
      return [
        { action: 'view', title: 'View Order' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
    case 'order_status':
      return [
        { action: 'track', title: 'Track Order' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
    case 'seller_request':
      return [
        { action: 'review', title: 'Review' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
    case 'product_approval':
      return [
        { action: 'view', title: 'View Details' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
    default:
      return [
        { action: 'open', title: 'Open' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
  }
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);
  
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = '/';

  // Determine URL based on notification type and action
  if (event.action === 'dismiss') {
    return;
  }

  switch (data.type) {
    case 'new_order':
      targetUrl = data.isAdmin ? `/admin/orders` : `/seller/orders`;
      if (data.orderId) targetUrl += `?order=${data.orderId}`;
      break;
    case 'order_status':
      targetUrl = `/orders`;
      if (data.orderId) targetUrl += `?order=${data.orderId}`;
      break;
    case 'seller_request':
      targetUrl = '/admin/seller-requests';
      break;
    case 'product_approval':
      targetUrl = data.status === 'approved' ? '/seller/restaurants' : '/seller/pending';
      break;
    case 'order_confirmation':
      targetUrl = '/orders';
      break;
    default:
      targetUrl = data.url || '/';
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already an open window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification closed:', event);
});

// Service worker install
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installing...');
  self.skipWaiting();
});

// Service worker activate
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activating...');
  event.waitUntil(clients.claim());
});
