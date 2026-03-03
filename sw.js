// 每次您有修改 index.html, app.js 或 data.js 時，
// 請務必打開這個檔案，將 v1 改成 v2、v3、v4... 依此類推！
const CACHE_NAME = 'iching-app-v8'; 

const urlsToCache = [
  './',
  './index.html',
  './data.js',
  './app.js',
  './manifest.json',
  './icon-512.png'
];

// 1. 安裝 Service Worker 並抓取新版檔案快取
self.addEventListener('install', event => {
  self.skipWaiting(); // 強制新版本立刻接管
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. 攔截網頁請求，優先從快取中讀取檔案（實現離線功能）
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

// 3. 啟動新版本時，清除舊版本的快取（這是自動更新的關鍵！）
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 如果手機裡存的快取名稱，跟目前的 CACHE_NAME 不一樣，就刪除它
          if (cacheName !== CACHE_NAME) {
            console.log('清除舊版快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});