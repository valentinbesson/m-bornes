const CACHE_NAME = 'm-bornes-v1.0.2';
const urlsToCache = [
  '.',
  './index.html',
  './script.js',
  './style.css',
  './manifest.json',
  './favicon.ico',
  // Assets - Images
  './assets/images/arrival.svg',
  './assets/images/arrow.svg',
  './assets/images/butterfly-75.png',
  './assets/images/Car.png',
  './assets/images/chevron-left.svg',
  './assets/images/chevron-right.svg',
  './assets/images/duck-50.png',
  './assets/images/hare-100.png',
  './assets/images/km-25.svg',
  './assets/images/km-50.svg',
  './assets/images/km-75.svg',
  './assets/images/km-100.svg',
  './assets/images/km-200.svg',
  './assets/images/reset.svg',
  './assets/images/rotate-ccw.svg',
  './assets/images/snail-25.png',
  './assets/images/swallow-200.png',
  './assets/images/user.svg',
  './assets/images/users.svg',
  // Assets - Distance cards
  './assets/distance/distance-25.svg',
  './assets/distance/distance-50.svg',
  './assets/distance/distance-75.svg',
  './assets/distance/distance-100.svg',
  './assets/distance/distance-200.svg',
  // Assets - Icons
  './assets/icons/icon-72x72.png',
  './assets/icons/icon-96x96.png',
  './assets/icons/icon-128x128.png',
  './assets/icons/icon-144x144.png',
  './assets/icons/icon-152x152.png',
  './assets/icons/icon-192x192.png',
  './assets/icons/icon-384x384.png',
  './assets/icons/icon-512x512.png',
  // External resources
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation en cours...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache ouvert, ajout des fichiers...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Tous les fichiers ont été mis en cache');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Erreur lors de la mise en cache:', error);
      })
  );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation en cours...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activé');
      return self.clients.claim();
    })
  );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retourner la réponse du cache si elle existe
        if (response) {
          return response;
        }

        // Sinon, effectuer la requête réseau
        return fetch(event.request).then((response) => {
          // Vérifier si c'est une réponse valide
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Cloner la réponse car elle ne peut être consommée qu'une seule fois
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // En cas d'erreur réseau, retourner une page hors ligne si disponible
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// Gestion des messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notification de mise à jour disponible
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});