/* Lưu app để mở nhanh; truyện đã xem (ảnh + giọng) nghe lại được khi mất mạng.
   Sửa file → tăng ?v= trong index.html và đổi BAN dưới đây. */
const BAN = 'truyen-dem-khuya-v10';
const CORE = ['./', 'index.html', 'style.css?v=9', 'app.js?v=9', 'du-lieu.js?v=9', 'manifest.webmanifest', 'anh/logo.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(BAN).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== BAN).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || r.headers.has('range')) return;
  const url = new URL(r.url);
  const same = url.origin === location.origin, font = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!same && !font) return;
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(BAN).then(c => c.put('./', cp)); return res; }).catch(() => caches.match('./')));
    return;
  }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => {
    if (res.ok && res.status === 200 || res.type === 'opaque') { const cp = res.clone(); caches.open(BAN).then(c => c.put(r, cp)); }
    return res;
  })));
});
