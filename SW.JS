const CACHE_STATIC = "kmax-static-v1";
const CACHE_DYNAMIC = "kmax-dynamic-v1";

const STATIC_ASSETS = [
  "/",
  "/offline.html"
];

// Instalar
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activar
self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

// Fetch inteligente
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // ❌ NO cachear zonas sensibles
  if (
    url.pathname.includes("/cart") ||
    url.pathname.includes("/checkout") ||
    url.pathname.includes("/admin")
  ) {
    return;
  }

  // 🖼️ Imágenes → cache primero
  if (event.request.destination === "image") {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return (
          cached ||
          fetch(event.request).then(res => {
            return caches.open(CACHE_DYNAMIC).then(cache => {
              cache.put(event.request, res.clone());
              return res;
            });
          })
        );
      })
    );
    return;
  }

  // 🌐 Páginas → network first
  event.respondWith(
    fetch(event.request)
      .then(res => {
        return caches.open(CACHE_DYNAMIC).then(cache => {
          cache.put(event.request, res.clone());
          return res;
        });
      })
      .catch(() => caches.match(event.request))
  );
});