// Coin Cabinet app. Plain JavaScript, no build step.
"use strict";

/* ---------- helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c]);
const num = (v) => (v === "" || v == null || isNaN(+v) ? null : +v);
let HIDE_NOW = false; // true only while Home or a coin page is being drawn with "hide values" on
const HIDDEN_TEXT = "•••";
const money = (n, dash = "—") => (n == null || isNaN(n) ? dash : HIDE_NOW ? HIDDEN_TEXT : n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const pct = (n) => (n == null || !isFinite(n) ? "—" : HIDE_NOW ? HIDDEN_TEXT : (n >= 0 ? "+" : "") + (n * 100).toFixed(1) + "%");
// A market price (spot or a coin's melt each) is not your coin value, so "hide values" leaves it showing.
const moneyOpen = (n, dash = "—") => { const h = HIDE_NOW; HIDE_NOW = false; try { return money(n, dash); } finally { HIDE_NOW = h; } };
const signCls = (n) => (n == null ? "" : n >= 0 ? "pos" : "neg");
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
// Dates use the phone's own time zone (toISOString would use London time and roll over early in the evening).
const localDate = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const today = () => localDate(new Date());
const TYPE_BY_ID = Object.fromEntries(COIN_TYPES.map((t) => [t.id, t]));
// The app's version. Goes up with every merged change (see CLAUDE.md), and shows at the bottom of Options.
const APP_VERSION = "0.58.2";
const shortName = (t) => t.name.replace(/\s*\(.*\)\s*$/, "");
const normMint = (m) => (m === "P" ? "" : m || "");

/* ---------- storage ---------- */
// Each person's coins live in their own private area: data/users/<id>/<key>.
// Keys: "settings", "c_<id>" for coins, "a_<id>" for albums.
const store = { mode: "loading", docs: new Map(), coll: null };
const writeChains = new Map();
let assetsApi = null;
let downloadsApi = null;
let sampleApi = null; // Claude, for reading coin photos (null when not available)

const DEFAULT_SETTINGS = {
  kind: "settings",
  spot: { gold: null, silver: null, platinum: null, copper: null },
  spotUpdated: null,
  hideSpot: {},
  hideValues: false, // Step 4.4: the eye button hides every dollar amount on Home and coin pages
  homeClosed: {}, // Home sections the user has folded shut
  hiddenGroups: [], // groups left out of the Home totals
  hiddenStacks: [], // stacks left out of the Home totals
  showSold: false,
  showHistory: true,
  showAdded: true,
  showSoldList: true,
  showMeltSec: true,
  soldAutoDone: false,
  bookEdition: "",
  shelfStyle: "bookcase", // Home look: "bookcase" or "safe"
  shelfLayout: { order: [], hidden: {}, hiddenItems: {}, pins: {} }, // Step 4.4: shelf order, hidden shelves/items, pins
};

function showBanner(text) {
  const b = $("#banner");
  if (!text) { b.hidden = true; return; }
  b.textContent = text;
  b.hidden = false;
}

// Demo mode (Step 9.1): made-up coins, kept in memory only. catalog/demo.js is fetched only when the demo opens.
async function startDemo() {
  await new Promise((ok, no) => { const s = document.createElement("script"); s.src = "catalog/demo.js"; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  store.mode = "demo";
  store.docs = new Map(demoDocs());
  store.docs.set("history", demoHistory());
  document.body.classList.add("demo");
  $("#banner").innerHTML = `Demo: these aren't real coins. <button class="link-btn" data-act="exitDemo">Exit demo</button>`;
  $("#banner").hidden = false;
  render();
}
async function initStore() {
  if (/[?&]demo(=|&|$)/.test(location.search)) { // the link .../CoinShelfTest/?demo
    try { await startDemo(); } catch (e) { store.mode = "memory"; showBanner("Couldn't open the demo. Check your connection and try again."); render(); }
    return;
  }
  // View-only snapshot: a copy of someone's coins baked into the page (for showing friends).
  if (window.COIN_SNAPSHOT) {
    store.mode = "snapshot";
    window.COIN_SNAPSHOT.docs.forEach((d) => store.docs.set(d.id, d.data));
    document.body.classList.add("readonly");
    showBanner("View-only snapshot of a coin collection, taken " + window.COIN_SNAPSHOT.taken + ". You can try adding a coin with +, but nothing is saved.");
    render();
    return;
  }
  if (!window.claude || typeof window.claude.use !== "function") {
    // On its own (not inside Claude): save on this device.
    if (typeof initLocalStore === "function" && await initLocalStore()) {
      if (typeof scheduleHistory === "function") scheduleHistory();
      render();
      fetchSpotPrices(true); // refreshes prices each time the app opens (when online)
      return;
    }
    store.mode = "memory";
    showBanner("This browser can't save (it may be a private window). Practice mode: nothing typed here is kept.");
    render();
    return;
  }
  const loadTimer = setTimeout(() => {
    if (store.mode === "loading") showBanner("Can't reach your saved coins yet. Check your connection; this page keeps trying.");
  }, 10000);
  try {
    const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
    claudeExtras();
    const id = user ? await user.id() : null;
    if (!db || !id) {
      clearTimeout(loadTimer);
      store.mode = "memory";
      showBanner("Sign in to Claude to save your coins. Practice mode: nothing typed here is kept.");
      render();
      return;
    }
    store.coll = db.collection("data/users/" + id);
    store.coll.onSnapshot(
      (snap) => {
        const next = new Map();
        snap.docs.forEach((d) => { if (d.exists) next.set(d.id, d.data()); });
        // Keep this page's own pending writes visible.
        store.docs = next;
        if (!snap.metadata.fromCache) {
          clearTimeout(loadTimer); showBanner("");
          if (!store.historyChecked && typeof scheduleHistory === "function") { store.historyChecked = true; scheduleHistory(); }
        }
        store.mode = "db";
        render();
      },
      (err) => {
        clearTimeout(loadTimer);
        showBanner(err && err.code === "revoked" ? "This page can no longer reach your saved coins." : "Lost the connection to your saved coins. Reopen the page to try again.");
      }
    );
  } catch (e) {
    clearTimeout(loadTimer);
    store.mode = "memory";
    showBanner("Couldn't open your saved coins. Practice mode: nothing typed here is kept.");
    render();
  }
}

async function claudeExtras() {
  try { assetsApi = await window.claude.use("assets"); } catch (e) { assetsApi = null; }
  try { downloadsApi = await window.claude.use("downloads"); } catch (e) { downloadsApi = null; }
  try {
    const sm = await window.claude.use("sample");
    const lim = sm ? await sm.limits().catch(() => null) : null;
    sampleApi = sm && lim && lim.images ? sm : null;
  } catch (e) { sampleApi = null; }
}

function put(key, obj, quiet) {
  const body = JSON.parse(JSON.stringify(obj));
  if (key.startsWith("c_") && typeof caseOnPut === "function") caseOnPut(store.docs.get(key), body); // dealer case: remember the old place
  store.docs.set(key, body);
  if (key !== "history" && typeof scheduleHistory === "function") scheduleHistory(); // value over time
  // Queue the save BEFORE redrawing: the redraw may add a coin ID (ensureIds) and queue its own save of this coin,
  // which must come after this one or the plain copy would overwrite the ID on disk.
  let next = Promise.resolve();
  if (store.mode === "local") next = chainWrite(key, () => localPut(key, body));
  else if (store.mode === "db" && store.coll) {
    const prev = writeChains.get(key) || Promise.resolve();
    next = prev.then(() => store.coll.doc(key).set(body)).catch((e) => {
      toast(e && e.code === "quota_exceeded" ? "Storage is full. Delete some old coins or photos." : "Couldn't save that change. Try again.");
    });
    writeChains.set(key, next);
  }
  if (!quiet) render();
  return next;
}
/* ---------- sharing ---------- */
const APP_URL = "https://waddelljmw.github.io/CoinShelfTest/";
// Opens the phone's Share menu with a file. Returns true if it was shared (or the person closed the menu).
async function shareFile(name, data, type, title) {
  try {
    const file = new File([data], name, { type });
    if (!navigator.canShare || !navigator.canShare({ files: [file] })) return false;
    await navigator.share({ files: [file], title });
    return true;
  } catch (e) { return !!(e && e.name === "AbortError"); }
}
async function shareAppLink() {
  const text = "Coin Cabinet: a free app for keeping track of a coin collection. Open this link in Chrome, then Menu → Add to Home screen. Your coins stay private on your own phone.";
  try { if (navigator.share) { await navigator.share({ title: "Coin Cabinet", text, url: APP_URL }); return; } }
  catch (e) { if (e && e.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(APP_URL); toast("Link copied: " + APP_URL); }
  catch (e) { toast("The app's address is " + APP_URL); }
}
// Writes to the same record happen in order.
function chainWrite(key, fn) {
  const next = (writeChains.get(key) || Promise.resolve()).then(fn);
  writeChains.set(key, next);
  return next;
}
function remove(key) {
  if (store.mode === "snapshot") return Promise.resolve();
  store.docs.delete(key);
  render();
  if (store.mode === "local") return chainWrite(key, () => localRemove(key));
  if (store.mode !== "db" || !store.coll) return Promise.resolve();
  const prev = writeChains.get(key) || Promise.resolve();
  const next = prev.then(() => store.coll.doc(key).delete()).catch(() => toast("Couldn't delete that. Try again."));
  writeChains.set(key, next);
  return next;
}

const settings = () => ({ ...DEFAULT_SETTINGS, ...(store.docs.get("settings") || {}), spot: { ...DEFAULT_SETTINGS.spot, ...((store.docs.get("settings") || {}).spot || {}) } });
const saveSettings = (patch, quiet) => put("settings", { ...settings(), ...patch }, quiet);
// "Mon, Nov. 2, 2026 @ 11:11am EST". Older saved values (a plain date, or odd text) still show.
const MONTHS_AP = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];
function stampText(v) {
  if (!v) return "";
  const dateOnly = /^\d{4}-\d\d-\d\d$/.test(v);
  const d = new Date(dateOnly ? v + "T12:00:00" : v);
  if (isNaN(d)) return String(v);
  const day = d.toLocaleDateString("en-US", { weekday: "short" }) + ", " + MONTHS_AP[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  if (dateOnly) return day;
  const h = d.getHours() % 12 || 12, m = String(d.getMinutes()).padStart(2, "0");
  const tz = (new Intl.DateTimeFormat("en-US", { timeZoneName: "short" }).formatToParts(d).find((p) => p.type === "timeZoneName") || {}).value || "";
  return day + " @ " + h + ":" + m + (d.getHours() < 12 ? "am" : "pm") + (tz ? " " + tz : "");
}
const allCoins = () => [...store.docs.values()].filter((d) => d.kind === "coin");
const ownedCoins = () => allCoins().filter((c) => c.status === "owned");
const soldCoins = () => allCoins().filter((c) => c.status === "sold");
const deletedCoins = () => allCoins().filter((c) => c.status === "deleted");
// Albums in the order you set on the Albums page (Reorder). Any not placed yet follow, A to Z.
const albums = () => {
  const order = settings().albumOrder || [];
  const pos = (a) => { const i = order.indexOf(a.id); return i < 0 ? Infinity : i; };
  const sorted = [...store.docs.values()].filter((d) => d.kind === "album").sort((a, b) => pos(a) - pos(b) || albumTitle(a).localeCompare(albumTitle(b)));
  // Albums in the same series always sit together, where the first one of them is.
  const key = albumSeriesKeys(sorted);
  const out = [], done = new Set();
  sorted.forEach((a) => {
    if (done.has(a.id)) return;
    const k = key.get(a.id);
    (k ? sorted.filter((x) => key.get(x.id) === k) : [a]).forEach((x) => { done.add(x.id); out.push(x); });
  });
  return out;
};
/* --- Album series: albums that belong together (Vol. 1, Vol. 2, ...) --- */
// Linked by you in Edit album (seriesId), or found automatically: same brand, back-to-back numbers
// (9128, 9129 or LCA8, LCA9) and the same coin. "solo" means you unlinked it.
const albumFamilies = (a) => new Set(albumTypes(a).map((id) => TYPE_BY_ID[id].family));
const numParts = (n) => { const m = String(n || "").toUpperCase().match(/^([A-Z]*)(\d+)$/); return m ? { pre: m[1], n: +m[2] } : null; };
function albumSeriesKeys(list) {
  const key = new Map();
  list.forEach((a) => { if (a.seriesId && a.seriesId !== "solo") key.set(a.id, a.seriesId); });
  const free = list.filter((a) => !a.seriesId && numParts(a.number));
  free.forEach((a) => {
    const pa = numParts(a.number);
    free.forEach((b) => {
      if (a === b || a.brand !== b.brand) return;
      const pb = numParts(b.number);
      if (pb.pre !== pa.pre || Math.abs(pb.n - pa.n) !== 1) return;
      const fa = albumFamilies(a);
      if (![...albumFamilies(b)].some((f) => fa.has(f))) return;
      const k = key.get(a.id) || key.get(b.id) || "auto:" + a.id;
      [...key].forEach(([id, v]) => { if (v === key.get(b.id) && key.get(b.id)) key.set(id, k); }); // join two chains
      key.set(a.id, k); key.set(b.id, k);
    });
  });
  // A series of one is just an album.
  const count = new Map(); key.forEach((v) => count.set(v, (count.get(v) || 0) + 1));
  [...key].forEach(([id, v]) => { if (count.get(v) < 2) key.delete(id); });
  return key;
}
const albumSeriesOf = (a) => albumSeriesKeys(albums()).get(a.id) || null;
function seriesTitle(members) {
  const fam = [...members.reduce((s, a) => { albumFamilies(a).forEach((f) => s.add(f)); return s; }, new Set())];
  return (fam.length === 1 ? fam[0].replace(/^./, (c) => c.toUpperCase()) + " series" : "Series") + " · " + members.length + " albums";
}
const getCoin = (id) => store.docs.get("c_" + id);
const getAlbum = (id) => store.docs.get("a_" + id);
// Saving changes to an imported coin takes it out of its import batch,
// so "remove last import" can never delete a coin you've since edited.
// For sale on/off from a coin's page (the Status choice in Edit does the same).
function putForSale(id, on) {
  const c = getCoin(id); if (!c || c.status !== "owned" || isInherited(c)) return;
  const n = { ...c }; if (on) n.stage = "forsale"; else delete n.stage;
  saveCoin(n); toast(on ? "Put up for sale." : "Taken off For sale.");
}
function saveCoin(c) {
  if (c.importBatch && getCoin(c.id)) { c = { ...c }; delete c.importBatch; }
  return put("c_" + c.id, c);
}
// In-app confirm step (the page can't use the browser's confirm()).
function confirmSheet(title, message, okLabel, onOk) {
  confirmSheet.fn = onOk;
  openSheet(`<div class="sheet-head"><h2>${esc(title)}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <p>${esc(message)}</p>
    <div class="btn-row"><button class="btn danger" data-act="confirmOk">${esc(okLabel)}</button><button class="btn" data-act="closeSheet">Cancel</button></div>`);
}

