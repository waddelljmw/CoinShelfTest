// Saving on this device (phone or computer), for when Coin Cabinet runs on its own, outside Claude.
// Everything is kept in the browser's built-in database (IndexedDB): one table for records
// (coins, albums, wants, settings) and one for photos. Loaded after app.js, before the app starts.
"use strict";

const LOCAL_DB_NAME = "coin-cabinet";
const localPhotoUrls = new Map(); // photo id -> address the page can show
let localDb = null;

function idbOpen() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(LOCAL_DB_NAME, 1);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains("docs")) db.createObjectStore("docs");
      if (!db.objectStoreNames.contains("photos")) db.createObjectStore("photos");
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.onblocked = () => rej(new Error("blocked"));
  });
}
// One read or write. mode: "readonly" | "readwrite".
function idb(storeName, mode, fn) {
  return new Promise((res, rej) => {
    const tx = localDb.transaction(storeName, mode);
    const st = tx.objectStore(storeName);
    let out;
    const r = fn(st);
    if (r) r.onsuccess = () => { out = r.result; };
    tx.oncomplete = () => res(out);
    tx.onerror = () => rej(tx.error);
    tx.onabort = () => rej(tx.error || new Error("aborted"));
  });
}
function idbAll(storeName) {
  return new Promise((res, rej) => {
    const out = [];
    const tx = localDb.transaction(storeName, "readonly");
    const c = tx.objectStore(storeName).openCursor();
    c.onsuccess = () => { const cur = c.result; if (cur) { out.push([cur.key, cur.value]); cur.continue(); } };
    tx.oncomplete = () => res(out);
    tx.onerror = () => rej(tx.error);
  });
}

// Start up in "local" mode. Returns false if this browser can't save (e.g. a private window).
async function initLocalStore() {
  if (!window.indexedDB) return false;
  try { localDb = await idbOpen(); } catch (e) { return false; }
  try {
    const docs = await idbAll("docs");
    // Anything typed in the moment before loading finished wins over the saved copy.
    const saved = new Set(docs.map(([k]) => k));
    docs.forEach(([k, v]) => { if (!store.docs.has(k)) store.docs.set(k, v); });
    // ...and gets saved too.
    for (const [k, v] of store.docs) if (!saved.has(k) && v) await idb("docs", "readwrite", (st) => st.put(v, k));
    const photos = await idbAll("photos");
    photos.forEach(([k, blob]) => localPhotoUrls.set(k, URL.createObjectURL(blob)));
  } catch (e) { return false; }
  store.mode = "local";
  downloadsApi = localDownloads;
  // Ask the browser to keep this data even when the phone runs low on space.
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* not supported */ }
  cleanUnusedPhotos();
  return true;
}
function localPut(key, body) {
  return idb("docs", "readwrite", (st) => st.put(body, key)).catch((e) => {
    toast(e && e.name === "QuotaExceededError" ? "This device is out of space. Delete some photos or make room, then try again." : "Couldn't save that change. Try again.");
  });
}
function localRemove(key) {
  return idb("docs", "readwrite", (st) => st.delete(key)).catch(() => toast("Couldn't delete that. Try again."));
}
// Keep a photo on this device. Returns its id.
async function localAddPhoto(blob) {
  const id = "p" + uid();
  await idb("photos", "readwrite", (st) => st.put(blob, id));
  localPhotoUrls.set(id, URL.createObjectURL(blob));
  return id;
}
// Photos no saved record points to (e.g. removed from a coin). Recently deleted coins keep theirs.
function photoIdsInUse() {
  const used = new Set();
  store.docs.forEach((d) => (d && d.photos || []).forEach((p) => { if (p && p.lid) used.add(p.lid); }));
  return used;
}
async function cleanUnusedPhotos() {
  try {
    const used = photoIdsInUse();
    const gone = [...localPhotoUrls.keys()].filter((k) => !used.has(k));
    for (const k of gone) {
      await idb("photos", "readwrite", (st) => st.delete(k));
      URL.revokeObjectURL(localPhotoUrls.get(k));
      localPhotoUrls.delete(k);
    }
  } catch (e) { /* try again next time */ }
}

// Saving a file (backup, report, spreadsheet, snapshot) as a normal download.
const localDownloads = {
  save({ filename, data, type }) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: type || (/\.html$/.test(filename) ? "text/html" : /\.csv$/.test(filename) ? "text/csv" : "application/json") });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.style.display = "none";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return Promise.resolve({ status: "saved" });
  },
};
