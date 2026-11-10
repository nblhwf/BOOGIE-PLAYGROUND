// Service worker sederhana supaya web tetap bisa dibuka saat sinyal jelek.
// Network-first: selalu ambil versi terbaru, cache hanya dipakai saat offline.
// Data Supabase (beda origin) tidak pernah di-cache di sini, jadi angka selalu segar saat online.
const VERSION = "boogie-v4b";
const SHELL = ["./", "index.html", "config.js", "data/seed.js", "data/photos.js", "assets/photos/group.jpg", "manifest.webmanifest", "assets/hero.jpg", "assets/icons/icon-192.png", "assets/icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("index.html")))
  );
});
