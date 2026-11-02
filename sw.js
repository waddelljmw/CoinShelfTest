// Keeps a copy of the app on the phone so it opens with no internet, and fetches new versions.
// CACHE must change with every release (it matches APP_VERSION in app.js); that's how phones notice an update.
const CACHE = "coin-cabinet-0.29.0";
const FILES = [
  "./", "index.html", "styles.css", "manifest.webmanifest",
  "catalog/data.js", "catalog/pricebook.js", "catalog/albums.js", "catalog/varieties.js",
  "app.js", "sheets.js", "photofill.js", "history.js", "wants.js", "boxes.js", "filters.js", "shelf.js", "report.js", "snapshot.js", "albumdb.js", "local.js", "backup.js", "pwa.js",
  "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png",
];
self.addEventListener("install", (e) => {
  // Fetch fresh copies (not the browser's cache) so the new version is complete.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: "reload" })))));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// The page asks for this when you tap "Update now".
self.addEventListener("message", (e) => { if (e.data === "update-now") self.skipWaiting(); });
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try { return await fetch(req); }
    catch (err) { return (req.mode === "navigate" && (await c.match("index.html"))) || Response.error(); }
  }));
});
