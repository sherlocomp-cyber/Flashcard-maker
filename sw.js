/* Arabic Flashcard Maker - service worker: jaringan dulu, cadangan dari cache (offline penuh).
   Berkas font ikut tersimpan otomatis saat pertama dipakai. Naikkan CACHE tiap rilis. */
const CACHE="flashcard-v1.0.0";
const ASSETS=["./","index.html","styles.css","app.js","manifest.webmanifest","icon.svg","vendor/html2canvas.min.js","vendor/jspdf.umd.min.js","vendor/fonts/fonts.css"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(ASSETS.map(a=>c.add(a)))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET"||new URL(e.request.url).origin!==location.origin)return;
  e.respondWith(
    fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r})
      .catch(()=>caches.match(e.request).then(r=>r||caches.match("index.html")))
  );
});
