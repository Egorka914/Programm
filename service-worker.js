const CACHE_NAME = "repair-app-v1";
const urlsToCache = [
  "/index.html",
  "/dashboard.html",
  "/style.css",
  "/auth.js",
  "/dashboard.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// Установка SW и кэширование файлов
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Обработка запросов
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).catch(() => caches.match("/index.html"))
      );
    })
  );
});

// Очистка старого кэша при обновлении
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      )
    )
  );
});
