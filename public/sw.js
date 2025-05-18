// public/sw.js
self.addEventListener('push', (event) => {
    const options = {
      body: event.data.text(),
      icon: '/icon-192x192.png',
      badge: '/badge.png'
    };
    event.waitUntil(
      self.registration.showNotification('Nouveau match!', options)
    );
  });