/**
 * Service Worker for Settler PWA
 * Provides offline support, caching, and security features
 */

const CACHE_NAME = 'settler-v1';
const API_CACHE_NAME = 'settler-api-v1';
const STATIC_CACHE_NAME = 'settler-static-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// API endpoints that should be cached (read-only)
const CACHEABLE_API_PATTERNS = [
  /^\/api\/v1\/jobs$/,
  /^\/api\/v1\/jobs\/[^/]+$/,
  /^\/api\/v1\/reconciliations\/[^/]+\/summary$/,
];

// Security: Only cache GET requests
const isCacheableRequest = (request) => {
  return request.method === 'GET' && 
         (STATIC_ASSETS.some(asset => request.url.includes(asset)) ||
          CACHEABLE_API_PATTERNS.some(pattern => pattern.test(new URL(request.url).pathname)));
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME && name !== STATIC_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Security: Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Security: Don't cache POST/PUT/DELETE requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests: Network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful responses
          if (response.ok && isCacheableRequest(request)) {
            const responseClone = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline response
            return new Response(
              JSON.stringify({ error: 'Offline', message: 'No cached data available' }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          });
        })
    );
    return;
  }

  // Static assets: Cache first, network fallback
  if (isCacheableRequest(request)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reconciliations') {
    event.waitUntil(syncReconciliations());
  }
});

async function syncReconciliations() {
  // Implementation for syncing reconciliation data when back online
  // This would read from IndexedDB and sync with API
  console.log('Syncing reconciliations...');
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'Settler Notification';
  const options = {
    body: data.body || '',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: data.tag || 'settler-notification',
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
