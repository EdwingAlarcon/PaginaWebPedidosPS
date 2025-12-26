/**
 * 🔧 SERVICE WORKER
 * Fase 3: PWA Features
 * Caché, offline, sincronización de fondo
 */

const CACHE_NAME = 'pagina-web-pedidos-v2.0.0';
const RUNTIME_CACHE = 'pagina-web-pedidos-runtime';
const API_CACHE = 'pagina-web-pedidos-api';

const STATIC_ASSETS = [
    // HTML
    '/index.html',
    '/inventory.html',
    
    // CSS
    '/css/styles.css',
    '/css/inventory.css',
    
    // JS - Config
    '/src/config/config.js',
    
    // JS - Modules
    '/src/modules/auth.js',
    '/src/modules/inventory.js',
    '/src/modules/excel.js',
    '/src/modules/forms.js',
    '/src/modules/ui.js',
    
    // JS - Core
    '/src/core/app.js',
    '/src/core/inventory.js',
    '/src/core/inventory-ui.js',
    '/src/main.js',
    
    // JS - Utils
    '/src/utils/sanitize.js',
    '/src/utils/validation.js',
    
    // External Libraries
    'https://alcdn.msauth.net/browser/2.26.0/js/msal-browser.min.js',
    
    // PWA
    '/pwa/manifest.json'
];

// 1. INSTALL EVENT
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching static assets...');
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('[SW] Some assets failed to cache:', err);
                // No fallar completamente si algún asset falla
                return Promise.resolve();
            });
        }).then(() => {
            console.log('[SW] ✅ Installation complete');
            self.skipWaiting(); // Activar inmediatamente
        }).catch((err) => {
            console.error('[SW] Installation error:', err);
        })
    );
});

// 2. ACTIVATE EVENT
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== API_CACHE) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[SW] ✅ Activation complete');
            return self.clients.claim(); // Controlar todas las páginas
        }).catch((err) => {
            console.error('[SW] Activation error:', err);
        })
    );
});

// 3. FETCH EVENT - Cache First (Static Assets)
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorar URLs no-https (excepto localhost)
    if (url.protocol !== 'https:' && !url.hostname.includes('localhost')) {
        return;
    }

    // API calls - Network First
    if (url.pathname.includes('/api/') || url.hostname.includes('graph.microsoft.com')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Static assets - Cache First
    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // HTML - Network First with Cache Fallback
    if (request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Default - Cache First
    event.respondWith(cacheFirst(request));
});

// 4. CACHE FIRST STRATEGY
async function cacheFirst(request) {
    try {
        // 1. Buscar en caché
        const cached = await caches.match(request);
        if (cached) {
            console.log('[SW] ✓ Served from cache:', request.url);
            return cached;
        }

        // 2. Si no está en caché, ir a red
        const response = await fetch(request);
        
        // 3. Guardar en caché si es éxito
        if (response.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.warn('[SW] Cache first error:', error);
        
        // Retornar página offline si es HTML
        if (request.mode === 'navigate') {
            return caches.match('/index.html');
        }
        
        throw error;
    }
}

// 5. NETWORK FIRST STRATEGY
async function networkFirst(request) {
    try {
        // 1. Intentar desde red
        const response = await fetch(request);
        
        // 2. Si es éxito, guardar en caché
        if (response.ok) {
            const cacheType = request.url.includes('/api/') ? API_CACHE : CACHE_NAME;
            const cache = await caches.open(cacheType);
            cache.put(request, response.clone());
        }
        
        console.log('[SW] ✓ Served from network:', request.url);
        return response;
    } catch (error) {
        console.warn('[SW] Network first error, checking cache:', error);
        
        // 3. Si falla red, usar caché
        const cached = await caches.match(request);
        if (cached) {
            console.log('[SW] ✓ Served from cache (offline):', request.url);
            return cached;
        }
        
        // 4. Si no hay nada, retornar offline page
        if (request.mode === 'navigate') {
            return caches.match('/index.html').then((response) => {
                if (response) return response;
                return new Response('Offline - No cached version available', { status: 503 });
            });
        }
        
        throw error;
    }
}

// 6. BACKGROUND SYNC
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync event:', event.tag);
    
    if (event.tag === 'sync-inventory') {
        event.waitUntil(syncInventory());
    }
});

async function syncInventory() {
    try {
        console.log('[SW] 🔄 Syncing inventory...');
        
        // Obtener datos del IndexedDB o localStorage
        const inventory = await getStoredInventory();
        
        if (!inventory || inventory.length === 0) {
            console.log('[SW] No inventory to sync');
            return;
        }

        // Intentar sincronizar con servidor
        const response = await fetch('/api/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(inventory)
        });

        if (response.ok) {
            console.log('[SW] ✅ Sync successful');
            // Limpiar datos locales después del sync exitoso
            await clearSyncQueue();
        } else {
            throw new Error(`Sync failed: ${response.status}`);
        }
    } catch (error) {
        console.error('[SW] Sync error:', error);
        // Reintentar más tarde
        self.registration.sync.register('sync-inventory');
    }
}

// 7. PUSH NOTIFICATIONS
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');
    
    const options = {
        body: event.data?.text() || 'Nueva notificación',
        icon: '/assets/images/icon-192x192.png',
        badge: '/assets/images/badge-72x72.png',
        tag: 'pwa-notification',
        requireInteraction: false
    };

    event.waitUntil(
        self.registration.showNotification('PaginaWebPedidosPS', options)
    );
});

// 8. NOTIFICATION CLICK
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked');
    
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // Si la aplicación ya está abierta, enfocarla
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si no, abrir nueva ventana
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// 9. MESSAGE HANDLER (para comunicarse con la app)
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.delete(RUNTIME_CACHE).then(() => {
                console.log('[SW] Runtime cache cleared');
            })
        );
    }
});

// 10. PERIODIC SYNC (Background Sync cada 30 minutos)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'sync-periodic') {
        event.waitUntil(syncInventory());
    }
});

// HELPERS

function isStaticAsset(pathname) {
    return /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i.test(pathname) ||
           pathname.includes('/assets/');
}

async function getStoredInventory() {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(['inventory'], 'readonly');
        const store = transaction.objectStore('inventory');
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.warn('[SW] Could not get stored inventory:', error);
        return null;
    }
}

async function clearSyncQueue() {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(['syncQueue'], 'readwrite');
        const store = transaction.objectStore('syncQueue');
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.warn('[SW] Could not clear sync queue:', error);
    }
}

async function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('PaginaWebPedidos', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('inventory')) {
                db.createObjectStore('inventory', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('syncQueue')) {
                db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

console.log('[SW] Service Worker script loaded');
