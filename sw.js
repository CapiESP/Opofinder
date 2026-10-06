// OpoFinder - Service Worker v5 (Closed Beta, Corporate SVGs & Terminal Alerts)
const CACHE_NAME = 'opofinder-cache-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activar inmediatamente sin esperar
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Advertencia en precache:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  // Limpiar cachés antiguas inmediatamente
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Eliminando caché antigua:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Las llamadas a APIs externas (BOE, Supabase) van directas a la red
  if (event.request.url.includes('boe.es') || event.request.url.includes('supabase.co')) {
    return;
  }

  // Estrategia Network-First para archivos propios de la app:
  // Intenta descargar la última versión de la red. Si no hay conexión, usa la caché.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// Soporte para Notificaciones Web Push
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Nueva Oposición en OpoFinder';
  const options = {
    body: data.body || 'Se ha detectado una nueva convocatoria que coincide con tus filtros.',
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: {
      url: data.url || './index.html'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('index.html') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./index.html');
      }
    })
  );
});
