/* Service worker mínimo: solo existe para que el navegador considere
   la app "instalable" (criterio de Chrome/Edge/Android) y para que el
   shell (HTML/CSS/JS/config/logos) cargue rápido y funcione si por un
   instante no hay conexión. Los datos siempre se piden en vivo a
   Supabase — este SW no los cachea. */

const CACHE_NAME = 'indicadores-gv-shell-v1';
const SHELL_FILES = [
  './',
  './index.html',
  './config.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Nunca cachear llamadas a Supabase: siempre red, siempre datos frescos.
  if (url.hostname.endsWith('supabase.co')) return;

  // Para el resto (shell propio), estrategia "cache primero, red de respaldo".
  if (event.request.method === 'GET' && url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const network = fetch(event.request)
          .then((res) => {
            if (res && res.ok) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
