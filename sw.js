const CACHE_NAME = 'iching-app-v1';
// 這裡列出我們所有需要離線使用的檔案
const urlsToCache = [
  './',
  './index.html',
  './data.js',
  './app.js',
  './manifest.json',
  './icon-512.png'
];

// 安裝 Service Worker 並抓取檔案快取
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// 攔截網頁請求，優先從快取中讀取檔案（實現離線功能）
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});