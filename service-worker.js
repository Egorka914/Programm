
const CACHE_NAME = "repair-app-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./dashboard.html",
  "./style.css",
  "./auth-simple.js",
  "./dashboard-simple.js"
  // Убрали иконки из кэша, так как их может не быть
];

// Установка SW и кэширование файлов
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Кэшируем по одному, чтобы если один файл не найден, остальные все равно закэшируются
      return Promise.all(
        urlsToCache.map(url => {
          return cache.add(url).catch(err => {
            console.log('Failed to cache:', url, err);
          });
        })
      );
    })
  );
});

// Обработка запросов - более надежная стратегия
self.addEventListener("fetch", (event) => {
  // Пропускаем не-GET запросы
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Возвращаем кэшированную версию, если есть
      if (response) {
        return response;
      }

      // Иначе загружаем из сети
      return fetch(event.request).then(networkResponse => {
        // Кэшируем успешные ответы
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback для HTML страниц
        if (event.request.url.indexOf('.html') !== -1) {
          return caches.match('./index.html');
        }
        return new Response('Not found', { status: 404 });
      });
    })
  );
});

// Очистка старого кэша
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
