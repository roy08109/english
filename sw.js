const CACHE_NAME = 'floor-op-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './english-192.png',
  './english-512.png'
];

// 安装：缓存关键资源
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 拦截请求：HTML 用网络优先（始终获取最新版），其他资源用缓存优先
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // 只处理同域请求
  if (url.origin !== location.origin) return;
  const isHTML = e.request.mode === 'navigate' || url.pathname.endsWith('.html');
  if (isHTML) {
    // 网络优先：先请求网络，失败时回退缓存
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // 缓存优先：静态资源用缓存
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request))
    );
  }
});
