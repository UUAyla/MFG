// 游索 PWA Service Worker - 離線快取
const CACHE_NAME = "yousuo-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon.svg"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(urlsToCache);
    }).then(function () {
      return self.skipWaiting();
    }).catch(function () {
      // 若離線或部分資源失敗仍可安裝
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.url.indexOf("http") !== 0) return;
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (res) {
        var clone = res.clone();
        if (res.status === 200 && event.request.url.startsWith(self.location.origin) && !event.request.url.includes("chrome-extension"))
          caches.open(CACHE_NAME).then(function (c) { c.put(event.request, clone); });
        return res;
      }).catch(function () {
        if (event.request.mode === "navigate")
          return caches.match("./index.html").then(function (c) { return c || new Response("離線中", { status: 503 }); });
        return new Response("", { status: 503 });
      });
    })
  );
});
