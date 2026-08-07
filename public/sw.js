// Service Worker for Resiliessance Web Push Notifications

self.addEventListener('install', (event) => {
  // Force immediate activation of the service worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim control over any open pages immediately
  event.waitUntil(self.clients.claim());
});

// Handle the incoming push event
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push event received but contains no data.');
    return;
  }

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    // Fallback if data is not JSON
    data = {
      title: 'Resiliessance',
      body: event.data.text()
    };
  }

  const title = data.title || 'Resiliessance';
  const options = {
    body: data.body || 'You have a new update.',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    // iOS Safari requires a direct interaction and standard settings
    tag: data.tag || 'resiliessance-notification',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle clicking on the notification banner
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Close the notification banner

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there is an active window already open in the app
      for (const client of clientList) {
        if ('focus' in client) {
          // Check if it's our app page
          if (client.url.includes(targetUrl) || client.url === new URL(targetUrl, self.location.origin).href) {
            return client.focus();
          }
        }
      }
      // If no window is active, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
