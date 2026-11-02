// Coin Cabinet app. Plain JavaScript, no build step.
"use strict";

/* ---------- helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c]);
const num = (v) => (v === "" || v == null || isNaN(+v) ? null : +v);
const money = (n, dash = "—") => (n == null || isNaN(n) ? dash : n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const pct = (n) => (n == null || !isFinite(n) ? "—" : (n >= 0 ? "+" : "") + (n * 100).toFixed(1) + "%");
const signCls = (n) => (n == null ? "" : n >= 0 ? "pos" : "neg");
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
// Dates use the phone's own time zone (toISOString would use London time and roll over early in the evening).
const localDate = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const today = () => localDate(new Date());
const TYPE_BY_ID = Object.fromEntries(COIN_TYPES.map((t) => [t.id, t]));
// The app's version. Goes up with every merged change (see CLAUDE.md), and shows at the bottom of Options.
const APP_VERSION = "0.24.3";
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
  hiddenGroups: [], // groups left out of the Home totals
  hiddenStacks: [], // stacks left out of the Home totals
  showSold: false,
  soldAutoDone: false,
  bookEdition: "",
  shelfStyle: "bookcase", // Home look: "bookcase" or "safe"
};

function showBanner(text) {
  const b = $("#banner");
  if (!text) { b.hidden = true; return; }
  b.textContent = text;
  b.hidden = false;
}

async function initStore() {
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
  store.docs.set(key, body);
  if (key !== "history" && typeof scheduleHistory === "function") scheduleHistory(); // value over time
  if (!quiet) render();
  if (store.mode === "local") return chainWrite(key, () => localPut(key, body));
  if (store.mode !== "db" || !store.coll) return Promise.resolve();
  const prev = writeChains.get(key) || Promise.resolve();
  const next = prev.then(() => store.coll.doc(key).set(body)).catch((e) => {
    toast(e && e.code === "quota_exceeded" ? "Storage is full. Delete some old coins or photos." : "Couldn't save that change. Try again.");
  });
  writeChains.set(key, next);
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

/* ---------- coin math ---------- */
function spotPerOz(metalKey) {
  const s = num(settings().spot[metalKey]);
  if (s == null) return null;
  return metalKey === "copper" ? s * LB_PER_TROY_OZ : s;
}
const meltKey = (c) => MELT_OF_METAL[c.metal] || null;
// What an entry is: a single coin (also every older entry), a proof/mint set, or a roll of coins.
const itemOf = (c) => (c.item === "set" || c.item === "roll" || c.item === "bullion" ? c.item : "coin");
const rollCountOf = (c) => Math.max(1, Math.round(num(c.rollCount) || 1));
// Metal in one entry: a roll holds rollCount coins of c.oz each.
const ozEach = (c) => (num(c.oz) || 0) * (itemOf(c) === "roll" ? rollCountOf(c) : 1);
const eachWord = (c) => (itemOf(c) === "roll" ? " per roll" : itemOf(c) === "set" ? " per set" : " each");
function rollFace(c) { const t = TYPE_BY_ID[c.typeId]; return t && t.face ? Math.round(t.face * rollCountOf(c) * 100) / 100 : null; }
function meltEach(c) {
  const m = meltKey(c);
  const oz = ozEach(c);
  if (!m || !oz) return null;
  const p = spotPerOz(m);
  return p == null ? null : oz * p;
}
const isJunk = (c) => c.gradeMode === "raw" && c.grade === "Junk";
/* ---------- Red Book values ---------- */
const hasSms = (c) => { const s = PRICE_BOOK.series[c.typeId]; return !!(s && s.sms && c.year && s.sms.rows[String(c.year)]); };
const gradeRank = (g) => GRADES.indexOf(g);
const isProofGrade = (g) => /^PR-/.test(g || "");
function bookTable(c) {
  const s = PRICE_BOOK.series[c.typeId];
  if (!s) return null;
  if (isProofGrade(c.grade)) return s.proof ? { t: s.proof, kind: "proof" } : null;
  if (c.sms && s.sms) return { t: s.sms, kind: "sms" };
  if (c.fbl && s.fbl) return { t: s.fbl, kind: "fbl" };
  return s.circ ? { t: s.circ, kind: "circ" } : null;
}
function bookBase(c, kind) {
  return String(c.year) + (kind === "proof" || kind === "sms" || !normMint(c.mint) ? "" : "-" + normMint(c.mint));
}
function bookKey(c, kind) {
  return bookBase(c, kind) + (c.variety ? "|" + c.variety : "");
}
// Varieties the book lists for this date and strike ("" = the regular coin).
function bookVarieties(c) {
  const t = TYPE_BY_ID[c.typeId];
  const own = (t && t.varieties && c.year && t.varieties[c.year + "|" + normMint(c.mint)]) || []; // design varieties we know (e.g. 2009 cents)
  const bt = bookTable(c);
  if (!bt || !c.year) return own;
  const base = bookBase(c, bt.kind);
  const book = Object.keys(bt.t.rows).filter((k) => k === base || k.startsWith(base + "|")).map((k) => k.split("|")[1] || "");
  return [...new Set([...book, ...own])];
}
// Some types change metal by year (1943 steel cents). Sets the draft's metal to match.
function applyYearMetal(d) {
  const t = TYPE_BY_ID[d.typeId];
  if (!t || !t.metalByYear) return;
  const mb = t.metalByYear[num(d.year)];
  if (mb) { d.metal = mb[0]; d.oz = mb[1] || ""; }
  else if (d.metal === "Steel") { d.metal = t.metal; d.oz = t.oz || ""; }
}
// Returns {price, grade, kind} for the highest listed grade at or below the coin's grade.
function bookLookup(c) {
  if (!c.year || !c.grade || c.grade === "Other" || c.grade === "Junk") return null;
  const bt = bookTable(c);
  if (!bt) return null;
  const r = gradeRank(c.grade);
  const priceIn = (row) => { let best = null; bt.t.grades.forEach((g, i) => { if (gradeRank(g) <= r && row[i] != null) best = { price: row[i], grade: g, kind: bt.kind }; }); return best; };
  const row = bt.t.rows[bookKey(c, bt.kind)];
  if (!row) {
    // No variety chosen, but the book only lists this date by variety (e.g. 1878 Morgan):
    // use the cheapest variety as a conservative estimate and say so.
    if (!c.variety) {
      const base = bookBase(c, bt.kind);
      const opts = Object.keys(bt.t.rows).filter((k) => k.startsWith(base + "|")).map((k) => priceIn(bt.t.rows[k])).filter(Boolean);
      if (opts.length) { const low = opts.reduce((x, y) => (y.price < x.price ? y : x)); return { ...low, asked: c.grade, guess: true }; }
      if (Object.keys(bt.t.rows).some((k) => k.startsWith(base + "|"))) return { below: true, lowest: bt.t.grades[0], kind: bt.kind };
    }
    return { none: true, kind: bt.kind };
  }
  const best = priceIn(row);
  return best ? { ...best, asked: c.grade } : { below: true, lowest: bt.t.grades[0], kind: bt.kind };
}
// Mintage from the same Red Book rows. "*" means the variety is counted in the date's total.
function mintageInfo(c) {
  const bt = bookTable(c);
  const all = PRICE_BOOK.mintage && PRICE_BOOK.mintage[c.typeId];
  if (!bt || !all || !c.year) return null;
  const tab = all[bt.kind] || (bt.kind === "fbl" ? all.circ : null);
  if (!tab) return null;
  let v = tab[bookKey(c, bt.kind)];
  let shared = false;
  if (v === "*" || v == null) {
    const base = bookBase(c, bt.kind);
    const sib = Object.keys(tab).find((k) => (k === base || k.startsWith(base + "|")) && tab[k] !== "*");
    if (!sib) return null;
    shared = true;
    v = tab[sib];
  }
  const txt = typeof v === "number" ? v.toLocaleString("en-US") : String(v);
  return { text: txt, shared, proof: bt.kind === "proof", sms: bt.kind === "sms" };
}
function mintageLine(c) {
  const m = mintageInfo(c);
  if (!m) return "";
  return `<div class="small muted" style="margin:-10px 0 12px">Mintage ${esc(m.text)}${m.proof ? " proofs" : m.sms ? " SMS sets" : ""}${m.shared ? " (all varieties of this date)" : ""}</div>`;
}
const bookPrice = (c) => { const b = bookLookup(c); return b && b.price != null ? b.price : null; };
function bookText(b) {
  if (!b) return "";
  const edName = settings().bookEdition || PRICE_BOOK.edition; const ed = edName ? " " + edName : "";
  if (b.none) return "Red Book" + ed + " has no listing for this date" + (b.kind === "proof" ? " and variety." : ".");
  if (b.below) return "Red Book" + ed + " prices start at " + b.lowest + ". Below that it's worth about melt.";
  return "Red Book" + ed + ": " + money(b.price) + " (" + b.grade.replace(/^PR/, "PF") + (b.kind === "fbl" ? " FBL" : b.kind === "sms" ? " SMS" : "") + ")" + (b.asked && b.asked !== b.grade ? ", the closest listed price below " + b.asked.replace(/^PR/, "PF") : "")
    + (b.guess ? ". No variety picked, so this is the lowest-priced variety for this date. Pick the variety for an exact value" : "");
}

// Red Book prices are for coins without problems, so a "Details" coin uses your value, else melt.
function valueEach(c) {
  if (itemOf(c) === "bullion") return num(c.value) ?? meltEach(c);
  if (itemOf(c) === "roll") return num(c.value) ?? (Math.max(rollFace(c) || 0, meltEach(c) || 0) || null);
  if (itemOf(c) === "set") return num(c.value);
  if (isJunk(c)) return meltEach(c);
  return num(c.value) ?? (hasProblems(c) ? null : bookPrice(c));
}
function valueSource(c) {
  if (itemOf(c) === "bullion") return num(c.value) != null ? "entered" : meltEach(c) != null ? "melt" : null;
  if (itemOf(c) === "roll") return num(c.value) != null ? "entered" : (meltEach(c) || 0) > (rollFace(c) || 0) ? "melt" : rollFace(c) ? "face" : null;
  if (itemOf(c) === "set") return num(c.value) != null ? "entered" : meltEach(c) != null ? "melt" : null;
  if (isJunk(c)) return "melt";
  if (num(c.value) != null) return "entered";
  if (!hasProblems(c) && bookPrice(c) != null) return "book";
  return meltEach(c) != null ? "melt" : faceEach(c) != null ? "face" : null;
}
// Best available value: entered value, else melt.
// Last resort for a single coin with no value, no Red Book price and no melt: its face value (catalog coins only).
const faceEach = (c) => { const t = itemOf(c) === "coin" && TYPE_BY_ID[c.typeId]; return t && t.face ? t.face : null; };
const bestEach = (c) => valueEach(c) ?? meltEach(c) ?? faceEach(c);
const qtyOf = (c) => Math.max(1, num(c.qty) || 1);
// Holder: saved choice, or for older coins (saved before holders existed) worked out from the album / certified fields.
const holderOf = (c) => c.holder || (c.albumId ? "Album" : c.gradeMode === "cert" ? "Slab" : "");
const holderText = (c) => { const h = holderOf(c); return h === "Other" ? (c.packaging || "").trim() || "Other" : h; };
const cacOf = (c) => (c.gradeMode === "cert" && (c.cac === "Green" || c.cac === "Gold") ? c.cac : "");
const cacBadge = (c) => (cacOf(c) ? `<span class="cac ${cacOf(c).toLowerCase()}" title="CAC ${cacOf(c)} sticker">CAC${cacOf(c) === "Gold" ? " Gold" : ""}</span>` : "");
// Groups: set on a coin, or worked out (Inherited from the source, otherwise My collection).
const groupOf = (c) => String(c.group || "").trim() || (isInherited(c) ? "Inherited" : "My collection");
function groupsPresent() {
  const g = [...new Set(ownedCoins().map(groupOf))];
  return g.sort((a, b) => (a === "My collection" ? -1 : b === "My collection" ? 1 : a === "Inherited" ? -1 : b === "Inherited" ? 1 : a.localeCompare(b)));
}
const hiddenGroups = () => settings().hiddenGroups || [];
// Stacks (Step 2.7): bars, rounds and other silver items, plus junk silver coins you put in one. Pure ounces = weight × purity.
const BULLION_SHAPES = ["Bar", "Round", "Other"];
const shapeName = (s) => (s === "Other" || s === "Shape" ? "Other silver item" : s || "Bar");
const BULLION_HOLDERS = ["Loose", "Capsule", "Tube", "Mint box", "Bag", "Other"];
const bullionOz = (c) => { const w = num(c.bWeight), p = num(c.bPurity); return w && p ? Math.round(w * p * 100000) / 100000 : 0; };
const stackOf = (c) => { const s = String(c.stack || "").trim(); return itemOf(c) === "bullion" ? s || "My " + (c.metal || "Silver") + " Stack" : s; };
const stacksPresent = () => [...new Set(ownedCoins().map(stackOf).filter(Boolean))].sort((a, b) => a.localeCompare(b));
const stackNames = () => [...new Set(["My Silver Stack", ...allCoins().map(stackOf).filter(Boolean)])];
const hiddenStacks = () => settings().hiddenStacks || [];
// A stacked item counts only when its group chip AND its stack chip are on.
const countedCoins = () => ownedCoins().filter((c) => !hiddenGroups().includes(groupOf(c)) && !hiddenStacks().includes(stackOf(c)));
const isInherited = (c) => (c.source || "").trim().toLowerCase() === "inherited";
const sum = (arr, f) => arr.reduce((t, x) => t + (f(x) || 0), 0);

/* --- Status, purchase, errors and problems (Step 2.2) --- */
// Saved status: owned | sold | gone | deleted. An owned coin can also be on the way or for sale (its "stage"),
// so everything that counts owned coins (totals, albums, reports) keeps working. Older coins have no stage: In collection.
const STATUS_TEXT = { owned: "In collection", coming: "On the way", forsale: "For sale", sold: "Sold", gone: "Gone" };
const stageOf = (c) => (c.status !== "owned" ? "" : c.stage === "coming" ? "coming" : c.stage === "forsale" && !isInherited(c) ? "forsale" : "");
const statusKey = (c) => (c.status === "owned" ? stageOf(c) || "owned" : c.status);
const goneCoins = () => allCoins().filter((c) => c.status === "gone");
const listOf = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x) : []);
const hasProblems = (c) => listOf(c.problems).length > 0;
// Tax, shipping and fees are for the whole entry (not each coin).
const BUY_EXTRAS = ["buyTax", "buyShip", "buyFees"];
// Total cost: paid each × quantity, plus tax, shipping and fees. Unknown until a price paid is entered.
function costOf(c) {
  const p = num(c.paid);
  return p == null ? null : Math.round((p * qtyOf(c) + sum(BUY_EXTRAS, (k) => num(c[k]))) * 100) / 100;
}
// Splitting an entry (selling part of it): share tax, shipping and fees by quantity so nothing is counted twice.
function splitExtras(c, n) {
  const q = qtyOf(c), keep = {}, part = {};
  BUY_EXTRAS.forEach((k) => {
    const v = num(c[k]);
    if (v == null) return;
    const p = Math.round((v * n / q) * 100) / 100;
    part[k] = String(p); keep[k] = String(Math.round((v - p) * 100) / 100);
  });
  return { keep, part };
}
const joinExtras = (a, b) => Object.fromEntries(BUY_EXTRAS.filter((k) => num(a[k]) != null || num(b[k]) != null).map((k) => [k, String(Math.round(((num(a[k]) || 0) + (num(b[k]) || 0)) * 100) / 100)]));
// Known die varieties for this coin's type, date, mint (and design, e.g. the state on a 50 States quarter).
function knownVarieties(c) {
  const y = num(c.year);
  return (KNOWN_VARIETIES[c.typeId] || []).filter(([yy, m, , des]) => yy === y && (m == null || normMint(m) === normMint(c.mint)) && (!des || des === c.variety)).map((e) => e[2]);
}
// Every photo a record points to: coin photos and receipt photos.
const photoRefsOf = (d) => [...((d && d.photos) || []), ...((d && d.receiptPhotos) || [])];
// Package tracking. The carrier is picked, or worked out from how the number looks.
const CARRIERS = ["USPS", "UPS", "FedEx", "DHL"];
function carrierOf(c) {
  if (CARRIERS.includes(c.trackCarrier)) return c.trackCarrier;
  const n = String(c.trackNo || "").replace(/\s/g, "").toUpperCase();
  if (/^1Z[0-9A-Z]{16}$/.test(n)) return "UPS";
  if (/^(9\d{19,21}|[A-Z]{2}\d{9}US)$/.test(n)) return "USPS";
  if (/^(\d{12}|\d{15})$/.test(n)) return "FedEx";
  return "";
}
function trackUrl(c) {
  const n = String(c.trackNo || "").replace(/\s/g, "");
  if (!n) return "";
  const e = encodeURIComponent(n);
  return { USPS: "https://tools.usps.com/go/TrackConfirmAction?tLabels=" + e, UPS: "https://www.ups.com/track?tracknum=" + e,
    FedEx: "https://www.fedex.com/fedextrack/?trknbr=" + e, DHL: "https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=" + e }[carrierOf(c)]
    || "https://www.google.com/search?q=" + encodeURIComponent("track package " + n); // unknown carrier: a search finds it
}
const pastSellers = () => [...new Set(allCoins().map((c) => (c.seller || "").trim()).filter(Boolean))].sort();

function gradeText(c) {
  if (itemOf(c) === "bullion") return [shapeName(c.bShape), num(c.bWeight) ? num(c.bWeight) + " oz" : "", num(c.bPurity) ? String(num(c.bPurity)).replace(/^0/, "") : ""].filter(Boolean).join(" · ");
  if (itemOf(c) === "set") return holderText(c) || "Set";
  if (itemOf(c) === "roll") return ["Roll of " + rollCountOf(c), c.rollCond, c.bankWrap ? "bank wrap" : ""].filter(Boolean).join(" · ");
  const g = c.grade === "Other" ? c.customGrade || "Other" : c.grade;
  const extra = (c.sms && !isProofGrade(c.grade) && hasSms(c) ? " SMS" : "") + (c.fbl && !isProofGrade(c.grade) && PRICE_BOOK.series[c.typeId] && PRICE_BOOK.series[c.typeId].fbl ? " FBL" : "")
    + (hasProblems(c) ? " Details" : "") + (c.variety ? " · " + c.variety : "") + (c.knownVar ? " · " + c.knownVar : "");
  if (c.gradeMode === "cert") return [c.service === "Other" ? c.customService || "Other" : c.service, g].filter(Boolean).join(" ") + extra;
  return (g ? "Raw " + g : "Raw") + extra;
}
function autoLabel(c) {
  const date = c.year ? String(c.year) + (c.mint ? "-" + c.mint : "") : "";
  if (itemOf(c) === "bullion") return [num(c.bWeight) ? num(c.bWeight) + " oz" : "", (c.bMaker || "").trim(), ...(c.bShape === "Other" || c.bShape === "Shape" ? ["Silver item"] : [c.metal || "Silver", c.bShape || "Bar"])].filter(Boolean).join(" ");
  if (itemOf(c) === "set") return [c.year, c.typeName].filter(Boolean).join(" ");
  if (itemOf(c) === "roll") return [date, (TYPE_BY_ID[c.typeId] || {}).name || c.typeName, "roll (" + rollCountOf(c) + ")"].filter(Boolean).join(" ");
  return [date, c.typeName, c.denom].filter(Boolean).join(" ");
}
const labelOf = (c) => c.label || autoLabel(c) || "Unnamed coin";
const familyOf = (c) => c.family || c.typeName || "Other";

function ebayUrl(c) {
  let q;
  if (c.gradeMode === "cert") {
    const date = c.year ? String(c.year) + (c.mint ? "-" + c.mint : "") : "";
    q = [date, c.typeName, gradeText(c)].filter(Boolean).join(" ");
  } else {
    q = labelOf(c) + (c.fbl && !isProofGrade(c.grade) ? " FBL" : "") + (isProofGrade(c.grade) ? " proof" : "");
  }
  return "https://www.ebay.com/sch/i.html?_nkw=" + encodeURIComponent(q) + "&LH_Sold=1&LH_Complete=1";
}

// Link to the grading service's own cert lookup (PCGS and NGC). NGC also needs the number part of the grade.
function certUrl(c) {
  const cert = String(c.cert || "").replace(/\s/g, "");
  if (c.gradeMode !== "cert" || !cert) return "";
  if (c.service === "PCGS") return "https://www.pcgs.com/cert/" + encodeURIComponent(cert);
  if (c.service === "NGC") {
    const g = (String(c.grade === "Other" ? c.customGrade : c.grade).match(/\d+/) || [""])[0];
    return "https://www.ngccoin.com/certlookup/" + encodeURIComponent(cert) + "/" + (g ? g + "/" : "");
  }
  return "";
}
function thumbHtml(c) {
  const p = (c.photos || [])[0];
  if (p) return `<img class="thumb" src="${esc(photoSrc(p))}" alt="" loading="lazy">`;
  return `<span class="thumb" aria-hidden="true">${esc((c.typeName || c.label || "?").trim().charAt(0).toUpperCase())}</span>`;
}
const photoSrc = (p) => (p.lid ? (typeof localPhotoUrls !== "undefined" && localPhotoUrls.get(p.lid)) || "" : p.id ? "/_blob/" + p.id : p.url || "");

/* ---------- navigation ---------- */
const VIEWS = ["home", "value", "albums", "wants", "coins", "stacks", "boxes", "guide", "options"];
function currentRoute() {
  const h = location.hash.replace(/^#/, "");
  if (VIEWS.includes(h)) return { view: h };
  if (h.startsWith("coin-")) return { view: "coin", id: h.slice(5) };
  if (h.startsWith("album-")) return { view: "album", id: h.slice(6) };
  if (h.startsWith("box-")) return { view: "box", id: h.slice(4) };
  return { view: "home" };
}
function go(hash) {
  closeMenu();
  if (!$("#sheet").hidden) closeSheet(); // leaving the page closes any open pop-up
  if (location.hash === "#" + hash) render(); else location.hash = hash;
  window.scrollTo(0, 0);
}
// Remember the page you were on before opening a coin, so its back button returns there.
let coinBackTo = null;
window.addEventListener("hashchange", (e) => {
  const oldHash = (String(e.oldURL || "").split("#")[1] || "home");
  const nowCoin = location.hash.startsWith("#coin-");
  if (nowCoin && !oldHash.startsWith("coin-")) coinBackTo = oldHash;
  if (!nowCoin) coinBackTo = null;
  render();
  window.scrollTo(0, 0);
});
function coinBackLink() {
  const h = coinBackTo || "coins";
  let name = { home: "Home", value: "Coin Value", albums: "Albums", wants: "Want List", coins: "Your Coins", stacks: "Stacks", boxes: "2x2 Storage Boxes", guide: "PCGS Photo Guide", options: "Options" }[h];
  if (!name && h.startsWith("box-")) { const b = getBox(h.slice(4)); name = b ? b.name : "Boxes"; }
  if (!name && h.startsWith("album-")) { const a = getAlbum(h.slice(6)); name = a ? albumTitle(a) : "Albums"; }
  return `<button class="link-btn" data-go="${esc(name ? h : "coins")}">← ${esc(name || "Your Coins")}</button>`;
}
function closeMenu() { $("#menu").hidden = true; $("#menuBtn").setAttribute("aria-expanded", "false"); }

/* ---------- rendering ---------- */
function render() {
  const r = currentRoute();
  const main = $("#view");
  if (store.mode === "loading") { main.innerHTML = `<div class="empty">Opening your cabinet…</div>`; return; }
  const menuKey = r.view === "coin" ? "coins" : r.view === "album" ? "albums" : r.view === "box" ? "boxes" : r.view;
  $$("#menu button").forEach((b) => b.classList.toggle("on", b.dataset.go === menuKey));
  if (typeof applyShelfStyle === "function") applyShelfStyle();
  const fn = { home: viewHome, value: viewValue, albums: viewAlbums, album: viewAlbum, wants: viewWants, coins: viewCoins, stacks: viewStacks, boxes: viewBoxes, box: viewBox, coin: viewCoin, guide: viewGuide, options: viewOptions }[r.view];
  // Keep the search box focus when the list re-renders.
  const active = document.activeElement;
  const keepSearch = active && active.id === "coinSearch" ? active.selectionStart : null;
  main.innerHTML = fn(r);
  if (keepSearch != null) { const s = $("#coinSearch"); if (s) { s.focus(); s.setSelectionRange(keepSearch, keepSearch); } }
}

// Small tags for the new statuses and Upgrade wanted.
function statusTags(c) {
  const k = statusKey(c);
  return (k === "coming" || k === "forsale" || k === "gone" ? `<span class="sold-tag st-${k}">${STATUS_TEXT[k]}</span>` : "")
    + (c.upgrade && c.status === "owned" ? `<span class="sold-tag st-up" title="Upgrade wanted">Upgrade</span>` : "");
}
function coinRow(c, opts = {}) {
  const v = bestEach(c);
  const m = meltEach(c);
  const q = qtyOf(c);
  return `<button class="coin-row" data-go="coin-${esc(c.id)}">
    ${thumbHtml(c)}
    <span class="coin-main">
      <span class="coin-label">${esc(labelOf(c))}</span>
      <span class="coin-sub">${q > 1 ? `<span class="qty">×${q}</span> ` : ""}${c.status === "sold" && c.sold && c.sold.date ? "Sold " + esc(c.sold.date) + " · " : ""}${esc(gradeText(c))}${cacBadge(c)}${c.metal ? " · " + esc(c.metal) : ""}${isInherited(c) ? `<span class="dns" title="Inherited: do not sell">Do not sell</span>` : ""}${c.status === "sold" ? `<span class="sold-tag">Sold</span>` : ""}${statusTags(c)}</span>
    </span>
    <span class="coin-val">${c.status === "sold" ? money(num(c.sold && c.sold.amount)) : money(v == null ? null : v * q)}${m != null && c.status !== "sold" ? `<div class="melt">melt ${money(m * q)}</div>` : ""}</span>
  </button>`;
}

const leftOut = () => [...hiddenGroups().filter((g) => groupsPresent().includes(g)), ...hiddenStacks().filter((n) => stacksPresent().includes(n))];
function viewHome() {
  const s = settings();
  const everything = ownedCoins();
  const owned = countedCoins(); // groups switched off are left out of the totals
  const count = sum(owned, qtyOf);
  const total = sum(owned, (c) => (bestEach(c) || 0) * qtyOf(c));
  const melt = sum(owned, (c) => (meltEach(c) || 0) * qtyOf(c));
  const gainCoins = owned.filter((c) => !isInherited(c) && costOf(c) != null);
  const paid = sum(gainCoins, costOf); // price paid plus tax, shipping and fees
  const gainVal = sum(gainCoins, (c) => (bestEach(c) || 0) * qtyOf(c));
  const gain = gainCoins.length ? gainVal - paid : null;
  const noValue = owned.filter((c) => valueSource(c) === "melt" && !isJunk(c) && itemOf(c) !== "bullion").length;
  const fromBook = owned.filter((c) => valueSource(c) === "book").length;

  // Chips first (what counts in the totals), then the shelf, then cost and gain.
  const chips = [
    ...(groupsPresent().length > 1 ? groupsPresent().map((g) => { const on = !hiddenGroups().includes(g); return `<button class="chip ${on ? "on" : ""}" data-act="toggleGroup" data-v="${esc(g)}" aria-pressed="${on}">${on ? "✓ " : ""}${esc(g)} · ${sum(everything.filter((c) => groupOf(c) === g), qtyOf)}</button>`; }) : []),
    ...stacksPresent().map((n) => { const on = !hiddenStacks().includes(n); return `<button class="chip ${on ? "on" : ""}" data-act="toggleStack" data-v="${esc(n)}" aria-pressed="${on}">${on ? "✓ " : ""}${esc(n)} · ${sum(everything.filter((c) => stackOf(c) === n), qtyOf)}</button>`; }),
  ];
  let html = `${typeof backupReminder === "function" ? backupReminder() : ""}<h1 class="sr-only">Your cabinet</h1>
  ${chips.length ? `<div class="chips home-chips" aria-label="Count in the totals">${chips.join("")}</div>` : ""}
  ${typeof shelfHtml === "function" ? shelfHtml(owned, { total, melt, count }) : ""}
  ${fromBook || leftOut().length || noValue ? `<div class="small muted home-notes">${[
    fromBook ? `${fromBook} coin${fromBook > 1 ? "s" : ""} valued from the Red Book.` : "",
    leftOut().length ? `Leaving out: ${leftOut().map(esc).join(", ")}.` : "",
    noValue ? `${noValue} coin${noValue > 1 ? "s" : ""} without a value ${noValue > 1 ? "are" : "is"} counted at melt.` : ""].filter(Boolean).join(" ")}</div>` : ""}
  <div class="stats">
    <div class="stat"><div class="k">Cost</div><div class="v">${money(paid, "$0.00")}</div><div class="small muted">Paid, with tax, shipping and fees</div></div>
    <div class="stat"><div class="k">Gain</div><div class="v ${signCls(gain)}">${gain == null ? "—" : money(gain)}</div><div class="small muted">${gain == null ? "Add prices paid" : pct(paid ? gain / paid : null) + " · inherited not counted"}</div></div>
  </div>`;
  if (typeof historyCard === "function") html += historyCard();

  // Melt Value by Metal, only for metals in the collection
  const metalRows = SPOT_METALS.map((m) => {
    const cs = owned.filter((c) => meltKey(c) === m.key && num(c.oz));
    if (!cs.length) return "";
    const oz = sum(cs, (c) => ozEach(c) * qtyOf(c));
    const mv = sum(cs, (c) => (meltEach(c) || 0) * qtyOf(c));
    return `<div class="rowline"><span>${m.label}<div class="small muted">${sum(cs, qtyOf)} coins · ${oz.toFixed(m.key === "copper" ? 2 : 3)} oz</div></span><span class="num">${spotPerOz(m.key) == null ? `<span class="muted small">no spot price</span>` : money(mv)}</span></div>`;
  }).join("");
  if (metalRows) html += `<h2>Melt Value by Metal</h2><div class="card">${metalRows}</div>`;

  if (s.showSold) html += soldCard();

  const recent = everything.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5);
  html += `<h2>Recently added</h2>`;
  html += recent.length ? `<div class="list">${recent.map((c) => coinRow(c)).join("")}</div>` : `<div class="card empty">No coins yet. Tap <b>+</b> to add your first coin.</div>`;

  const sold = soldCoins().slice().sort((a, b) => {
    const da = (a.sold && a.sold.date) || "", db = (b.sold && b.sold.date) || "";
    return da !== db ? (da < db ? 1 : -1) : ((b.sold && b.sold.at) || 0) - ((a.sold && a.sold.at) || 0);
  }).slice(0, 5);
  // Only shown once at least one coin has been sold.
  if (sold.length) {
    html += `<h2>Recently sold</h2><div class="list">${sold.map((c) => coinRow(c)).join("")}</div>`;
    if (soldCoins().length > 5) html += `<div style="margin-top:8px"><button class="link-btn" data-act="seeSold">See all sold coins</button></div>`;
  }
  return html;
}

function viewStacks() {
  const names = stacksPresent();
  const head = `<h1>Stacks</h1><div class="small muted" style="margin-bottom:10px">Bars, rounds and junk silver, kept apart from your coins. Each stack counts in your Home totals (switch one off with its chip on Home).</div>`;
  const add = `<button class="btn block primary" data-act="addBullion" style="margin-top:10px">+ Add a bar, round or other silver item</button>`;
  if (!names.length) return head + `<div class="card empty">No stacks yet. Add a bar or round, or put a junk silver coin in a stack from its Holder section.</div>` + add;
  return head + names.map((n) => {
    const cs = ownedCoins().filter((c) => stackOf(c) === n);
    const oz = sum(cs, (c) => ozEach(c) * qtyOf(c));
    const melt = cs.some((c) => meltEach(c) == null) ? null : sum(cs, (c) => meltEach(c) * qtyOf(c));
    const val = sum(cs, (c) => (bestEach(c) || 0) * qtyOf(c));
    return `<details class="card"><summary><b>${esc(n)}</b>${hiddenStacks().includes(n) ? ` <span class="muted small">· left out of Home totals</span>` : ""}
      <div class="small muted">${sum(cs, qtyOf)} item${sum(cs, qtyOf) > 1 ? "s" : ""} · ${oz.toFixed(3)} oz pure · melt ${money(melt)} · value ${money(val)}</div></summary>
      <div class="list" style="margin-top:8px">${cs.map((c) => coinRow(c)).join("")}</div></details>`;
  }).join("") + add;
}

function soldCard() {
  const sold = soldCoins().filter((c) => !isInherited(c));
  const revenue = sum(sold, (c) => num(c.sold && c.sold.amount));
  const costs = sum(sold, (c) => (num(c.sold && c.sold.shipping) || 0) + (num(c.sold && c.sold.insurance) || 0));
  const basis = sum(sold, (c) => costOf(c) || 0);
  const profit = revenue - costs - basis;
  const margin = revenue ? profit / revenue : null;
  return `<h2>Sold results</h2><div class="stats">
    <div class="stat"><div class="k">Sold</div><div class="v">${sum(sold, qtyOf)}</div><div class="small muted">${money(revenue, "$0.00")} in sales</div></div>
    <div class="stat"><div class="k">Margin</div><div class="v ${signCls(margin)}">${pct(margin)}</div><div class="small muted">${money(profit, "$0.00")} profit</div></div>
  </div><div class="small muted" style="margin:6px 0 4px">After shipping, insurance and what you paid. Inherited coins aren't counted.</div>`;
}

function viewValue() {
  const owned = ownedCoins();
  if (!owned.length) return `<h1>Coin Value</h1><div class="card empty">Add coins to see what they're worth.</div>`;
  const byFam = {};
  owned.forEach((c) => {
    const f = familyOf(c);
    byFam[f] = byFam[f] || { n: 0, v: 0, m: 0 };
    byFam[f].n += qtyOf(c);
    byFam[f].v += (bestEach(c) || 0) * qtyOf(c);
    byFam[f].m += (meltEach(c) || 0) * qtyOf(c);
  });
  const fams = Object.entries(byFam).sort((a, b) => b[1].v - a[1].v);
  const top = owned.slice().sort((a, b) => (bestEach(b) || 0) * qtyOf(b) - (bestEach(a) || 0) * qtyOf(a)).slice(0, 10);
  const premium = owned.filter((c) => valueEach(c) != null && meltEach(c)).map((c) => ({ c, p: valueEach(c) / meltEach(c) - 1 })).sort((a, b) => b.p - a.p).slice(0, 5);
  return `<h1>Coin Value</h1>
    <h2>By coin type</h2>
    <div class="card">${fams.map(([f, x]) => `<div class="rowline"><span>${esc(f)}<div class="small muted">${x.n} coin${x.n > 1 ? "s" : ""}${x.m ? " · melt " + money(x.m) : ""}</div></span><span class="num">${money(x.v)}</span></div>`).join("")}</div>
    <h2>Most valuable</h2>
    <div class="list">${top.map((c) => coinRow(c) + `<div class="small" style="text-align:right;margin:-4px 4px 6px"><a href="${esc(ebayUrl(c))}" target="_blank" rel="noopener">eBay sold ↗</a></div>`).join("")}</div>
    ${premium.length ? `<h2>Highest premium over melt</h2><div class="card">${premium.map(({ c, p }) => `<div class="rowline"><button class="link-btn" data-go="coin-${esc(c.id)}">${esc(labelOf(c))}</button><span class="num ${signCls(p)}">${pct(p)} · <a href="${esc(ebayUrl(c))}" target="_blank" rel="noopener">eBay ↗</a></span></div>`).join("")}</div>` : ""}
    <p class="small muted">Values are the ones you enter, then Red Book values, then melt. Use <b>Check eBay sold</b> on any coin to see recent real sale prices.</p>`;
}

/* --- Your Coins --- */
const listState = { family: null, metal: "", cert: "", status: "owned", stage: "", q: "", sort: "year", dir: "asc" };
// "Show" choices inside In collection: only the ones that have coins.
function stageChoices() {
  const o = ownedCoins();
  return [["coming", "On the way"], ["forsale", "For sale"], ["upgrade", "Upgrade wanted"]].filter(([k]) => o.some((c) => (k === "upgrade" ? c.upgrade : stageOf(c) === k)));
}
function viewCoins() {
  if (listState.status === "gone" && !goneCoins().length) listState.status = "owned";
  const base = listState.status === "sold" ? soldCoins() : listState.status === "gone" ? goneCoins() : ownedCoins().filter((c) => itemOf(c) !== "bullion"); // bars live on the Stacks page; coins stay here even when stacked
  const stackedN = ownedCoins().filter((c) => itemOf(c) === "bullion").length;
  const stages = listState.status === "owned" ? stageChoices() : [];
  if (listState.stage && !stages.some(([k]) => k === listState.stage)) listState.stage = "";
  const famCounts = {};
  base.forEach((c) => { famCounts[familyOf(c)] = (famCounts[familyOf(c)] || 0) + qtyOf(c); });
  const fams = [...new Set([...COMMON_FAMILIES, ...Object.keys(famCounts)])];
  let list = base.filter((c) =>
    (!listState.family || familyOf(c) === listState.family) &&
    (!listState.metal || c.metal === listState.metal) &&
    (!listState.cert || c.gradeMode === listState.cert) &&
    (!listState.stage || (listState.stage === "upgrade" ? c.upgrade : stageOf(c) === listState.stage)) &&
    (!listState.q || (labelOf(c) + " " + gradeText(c) + " " + (c.notes || "") + " " + (c.source || "") + " " + (c.seller || "") + " " + (c.caseName || "")).toLowerCase().includes(listState.q.toLowerCase())));
  const key = {
    year: (c) => num(c.year) ?? 99999,
    value: (c) => (bestEach(c) || 0) * qtyOf(c),
    melt: (c) => (meltEach(c) || 0) * qtyOf(c),
    acquired: (c) => c.acquired || "",
    type: (c) => familyOf(c) + " " + String(c.year || "").padStart(5, "0") + (c.mint || ""),
  }[listState.sort];
  list.sort((a, b) => { const x = key(a), y = key(b); return (x > y ? 1 : x < y ? -1 : 0) * (listState.dir === "asc" ? 1 : -1); });
  const metalsPresent = [...new Set(base.map((c) => c.metal).filter(Boolean))];
  return `<h1>Your Coins</h1>
    <div class="seg" style="margin-bottom:10px">
      <button data-act="status" data-v="owned" class="${listState.status === "owned" ? "on" : ""}">In collection (${sum(ownedCoins().filter((c) => itemOf(c) !== "bullion"), qtyOf)})</button>
      <button data-act="status" data-v="sold" class="${listState.status === "sold" ? "on" : ""}">Sold (${sum(soldCoins(), qtyOf)})</button>
      ${goneCoins().length ? `<button data-act="status" data-v="gone" class="${listState.status === "gone" ? "on" : ""}">Gone (${sum(goneCoins(), qtyOf)})</button>` : ""}
    </div>
    ${stackedN && listState.status === "owned" ? `<div class="small muted" style="margin:-4px 0 8px">${stackedN} bar${stackedN > 1 ? "s, rounds or other silver items are" : ", round or other silver item is"} in <button class="link-btn" data-go="stacks">Stacks</button>.</div>` : ""}
    ${stages.length ? `<label class="f" style="margin:-4px 0 8px"><span>Show</span><select data-list="stage"><option value="">All in collection</option>${stages.map(([k, l]) => `<option value="${k}" ${listState.stage === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>` : ""}
    <div class="chips">
      <button class="chip ${!listState.family ? "on" : ""}" data-act="fam" data-v="">All</button>
      ${fams.map((f) => `<button class="chip ${listState.family === f ? "on" : ""} ${famCounts[f] ? "" : "zero"}" data-act="fam" data-v="${esc(f)}">${esc(f)}${famCounts[f] ? " · " + famCounts[f] : ""}</button>`).join("")}
    </div>
    <div class="toolbar">
      <input type="search" id="coinSearch" placeholder="Search" value="${esc(listState.q)}" data-list="q">
    </div>
    ${listState.q.trim() ? searchLine(list) : ""}
    <div class="toolbar">
      <select data-list="metal" aria-label="Metal"><option value="">All metals</option>${metalsPresent.map((m) => `<option ${listState.metal === m ? "selected" : ""}>${esc(m)}</option>`).join("")}</select>
      <select data-list="cert" aria-label="Raw or certified"><option value="">Raw + certified</option><option value="raw" ${listState.cert === "raw" ? "selected" : ""}>Raw</option><option value="cert" ${listState.cert === "cert" ? "selected" : ""}>Certified</option></select>
    </div>
    <div class="toolbar">
      <select data-list="sort" aria-label="Sort by">${[["year", "Year"], ["value", "Value"], ["melt", "Melt value"], ["acquired", "Date acquired"], ["type", "Coin type"]].map(([k, l]) => `<option value="${k}" ${listState.sort === k ? "selected" : ""}>Sort: ${l}</option>`).join("")}</select>
      <button class="btn" data-act="dir" style="flex:0 0 auto">${listState.dir === "asc" ? "↑ Low to high" : "↓ High to low"}</button>
    </div>
    ${list.length ? `<div class="list">${list.map((c) => coinRow(c)).join("")}</div>` : `<div class="card empty">${base.length ? "No coins match these filters." : listState.status === "sold" ? "No sold coins yet." : "No coins yet. Tap <b>+</b> to add one."}</div>`}`;
}

// One small line under the search box: count, value and melt of the coins found.
function searchLine(list) {
  const n = sum(list, qtyOf);
  const melt = sum(list, (c) => (meltEach(c) || 0) * qtyOf(c));
  const sold = listState.status === "sold";
  const value = sold ? sum(list, (c) => num(c.sold && c.sold.amount)) : sum(list, (c) => (bestEach(c) || 0) * qtyOf(c));
  return `<div class="small muted" style="margin:-4px 2px 10px">${n} coin${n === 1 ? "" : "s"} · ${sold ? "Sold for" : "Value"} ${money(value, "$0.00")} · Melt ${money(melt, "$0.00")}</div>`;
}

/* --- Date limits --- */
// Owned coins: no later than this year, and inside the years the coin type was made.
// Wants: up to WANT_YEARS_AHEAD years past this year (for coins you know are coming).
const WANT_YEARS_AHEAD = 5;
const thisYear = () => new Date().getFullYear();
// A type still being made in the catalog (its end year is the catalog's last year) runs to today.
const typeLastYear = (t) => (t.end >= 2026 ? Math.max(t.end, thisYear()) : t.end);
// Returns a short message if the year isn't allowed, or "" if it is. kind: "coin" | "want" | "album".
function yearProblem(typeId, year, kind) {
  const y = num(year);
  if (y == null || year === "") return "";
  const t = TYPE_BY_ID[typeId];
  const cap = kind === "want" ? thisYear() + WANT_YEARS_AHEAD : thisYear();
  if (y > cap) return kind === "want" ? "Wants can be at most " + cap + "." : "That year hasn't happened yet. The latest is " + cap + ".";
  if (y < 1) return "Enter a real year.";
  const last = t && (t.end >= 2026 ? cap : t.end); // a series still being made can run up to the cap
  if (t && t.skipYears && t.skipYears.includes(y)) return t.name + " wasn't made in " + y + ".";
  if (t && (y < t.start || y > last)) {
    // Another type of the same coin covers this year (e.g. 2021 Morgan, 2009 cent): point to it.
    const alt = COIN_TYPES.find((o) => o.id !== t.id && o.family === t.family && y >= o.start && y <= (o.end >= 2026 ? cap : o.end));
    return t.name + " was made " + t.start + "–" + last + "." + (alt ? " For " + y + ", pick " + alt.name + "." : "");
  }
  return "";
}
// The years an album of this type can cover.
const albumYearRange = (typeId) => { const t = TYPE_BY_ID[typeId]; return t ? [t.start, typeLastYear(t)] : [1, thisYear()]; };

/* --- Coin detail --- */
// Coin page cards. Rows with nothing in them are left out.
// Several coins sharing one case (e.g. three 1943 steel cents): each is its own coin, linked by the case name.
const caseMates = (c) => (c.caseName ? ownedCoins().filter((o) => o.id !== c.id && (o.caseName || "").trim().toLowerCase() === c.caseName.trim().toLowerCase()) : []);
function caseCard(c) {
  if (!c.caseName || c.status !== "owned") return "";
  const mates = caseMates(c);
  return `<div class="card"><div class="muted small">In case</div><b>${esc(c.caseName)}</b> <span class="muted small">· ${mates.length + 1} coins</span>
    ${mates.length ? `<div class="list" style="margin-top:8px">${mates.map((o) => coinRow(o)).join("")}</div>` : ""}
    <button class="btn block" style="margin-top:8px" data-act="addToCase" data-id="${esc(c.id)}">Add another coin to this case</button></div>`;
}
function purchaseCard(c, row) {
  const m = (k) => (num(c[k]) == null ? null : money(num(c[k])));
  const cost = costOf(c);
  const extras = BUY_EXTRAS.some((k) => num(c[k]) != null);
  const body = [row("Where", esc(c.source)), row("Seller", esc(c.seller)), row("Date", esc(c.acquired)),
    row(qtyOf(c) > 1 ? "Paid each" : "Paid", m("paid")), row("Tax", m("buyTax")), row("Shipping", m("buyShip")), row("Fees", m("buyFees")),
    extras || qtyOf(c) > 1 ? row("Total cost", cost == null ? null : "<b>" + money(cost) + "</b>") : "",
    row("Paid with", esc(c.payMethod)), row("Receipt number", esc(c.receiptNo))].join("");
  const rec = (c.receiptPhotos || []).length ? `<div class="detail-photos">${(c.receiptPhotos || []).map((p) => `<img src="${esc(photoSrc(p))}" alt="Receipt photo">`).join("")}</div>` : "";
  return body.replace(/\s/g, "") || rec ? `<div class="card"><b>Purchase</b>${body}${rec}</div>` : "";
}
function errorsCard(c, row) {
  const errs = listOf(c.mintErrors), probs = listOf(c.problems);
  if (!c.knownVar && !errs.length && !probs.length && !c.errorNote) return "";
  return `<div class="card"><b>Errors and problems</b>${row("Known variety", esc(c.knownVar))}${row("Mint errors", esc(errs.join(", ")))}${row("Problems", probs.length ? esc(probs.join(", ")) + ` <span class="muted small">(Details coin)</span>` : null)}${c.errorNote ? `<div class="small" style="white-space:pre-wrap;margin-top:4px">${esc(c.errorNote)}</div>` : ""}</div>`;
}
function viewCoin(r) {
  const c = getCoin(r.id);
  if (!c || c.status === "deleted") return `<div class="card empty">That coin isn't here. <button class="link-btn" data-go="coins">Back to Your Coins</button></div>`;
  const q = qtyOf(c);
  const v = valueEach(c);
  const m = meltEach(c);
  const album = c.albumId ? getAlbum(c.albumId) : null;
  const row = (k, val) => (val == null || val === "" ? "" : `<div class="rowline"><span class="muted">${k}</span><span class="num" style="text-align:right">${val}</span></div>`);
  const sold = c.sold || {};
  return `${coinBackLink()}
    <h1 style="margin-top:10px">${esc(labelOf(c))}${isInherited(c) ? ` <span class="dns">Inherited · do not sell</span>` : ""}</h1>
    ${album && c.status === "owned" ? `<div class="album-chip"><span aria-hidden="true">📖</span> In <button class="link-btn" data-go="album-${esc(album.id)}">${esc(albumTitle(album))}</button></div>` : ""}
    ${mintageLine(c)}
    ${(c.photos || []).length ? `<div class="detail-photos">${c.photos.map((p) => `<img src="${esc(photoSrc(p))}" alt="Coin photo">`).join("")}</div>` : ""}
    <div class="card">
      ${row("Status", esc(STATUS_TEXT[statusKey(c)] || "") + (c.upgrade && c.status === "owned" ? " · Upgrade wanted" : ""))}
      ${itemOf(c) === "coin" ? row("Grade", esc(gradeText(c)) + cacBadge(c) + (photoGuideCode(c) ? ` <a class="small" href="${esc(photoGuideUrl(c))}" target="_blank" rel="noopener">PCGS photos ↗</a>` : "")) : ""}
      ${itemOf(c) === "set" ? row("Set", esc(c.typeName)) : ""}
      ${itemOf(c) === "bullion" ? row("Type", esc(shapeName(c.bShape))) + row("Maker", esc(c.bMaker)) + row("Serial number", esc(c.bSerial)) + row("Weight", num(c.bWeight) ? esc(num(c.bWeight)) + " oz" : null) + row("Purity", esc(c.bPurity)) : ""}
      ${stackOf(c) ? row("Stack", esc(stackOf(c))) : ""}
      ${itemOf(c) === "roll" ? row("Coins in roll", rollCountOf(c)) + row("Face value", rollFace(c) == null ? null : money(rollFace(c))) + row("Condition", esc([c.rollCond, c.bankWrap ? "Original bank wrap" : ""].filter(Boolean).join(" · "))) : ""}
      ${c.gradeMode === "cert" ? row("Cert number", esc(c.cert)) : ""}
      ${c.gradeMode === "cert" ? row("Catalog number", esc(c.catNo)) : ""}
      ${row("Holder", esc(holderText(c)))}
      ${row("2x2 storage box", typeof boxText === "function" ? esc(boxText(c)) : "")}
      ${row("COA", c.coa ? "Included" : null)}
      ${holderOf(c) !== "Other" ? row("Box / packaging", esc(c.packaging)) : ""}
      ${row("Quantity", q > 1 ? q : null)}
      ${row(itemOf(c) === "bullion" && valueSource(c) === "melt" ? "Value (melt)" : isJunk(c) ? "Value (junk = melt)" : valueSource(c) === "book" ? "Value each (Red Book)" : valueSource(c) === "face" ? "Value each (face value)" : "Value" + eachWord(c), money(v))}
      ${valueSource(c) === "entered" && bookPrice(c) != null ? row("Red Book", money(bookPrice(c)) + ` <span class="muted small">${esc(bookLookup(c).grade.replace(/^PR/, "PF"))}</span>`) : ""}
      ${row("Melt" + eachWord(c), m == null ? (meltKey(c) ? "Enter spot price" : null) : money(m))}
      ${q > 1 ? row("Total value", money((bestEach(c) || 0) * q)) : ""}
      ${row("Metal", esc([c.metal, num(c.oz) ? num(c.oz) + " oz" + (itemOf(c) === "roll" ? " per coin" : itemOf(c) === "set" ? " in the set" : itemOf(c) === "bullion" ? " pure" : "") : ""].filter(Boolean).join(" · ")))}
    </div>
    ${purchaseCard(c, row)}
    ${errorsCard(c, row)}
    ${c.trackNo ? `<div class="card"><b>${stageOf(c) === "coming" ? "On the way" : "Shipping"}</b>${row("Tracking", esc(c.trackNo))}${row("Carrier", esc(carrierOf(c) || "Not sure"))}${row("Received", esc(c.receivedDate || ""))}
      <a class="btn block" style="display:block;text-align:center;text-decoration:none;color:inherit;margin-top:8px" href="${esc(trackUrl(c))}" target="_blank" rel="noopener">Track package ↗</a></div>` : ""}
    ${stageOf(c) === "coming" ? `<button class="btn block primary" style="margin-bottom:8px" data-act="received" data-id="${esc(c.id)}">✓ Mark as received</button>` : ""}
    ${c.status === "gone" ? `<div class="card"><b>Gone</b>${row("Why", esc((c.gone && c.gone.reason) || ""))}${row("Date", esc((c.gone && c.gone.date) || ""))}<div class="small muted">Not counted in your totals.</div></div>` : ""}
    ${c.status === "sold" ? `<div class="card"><b>Sold</b>${row("Date", esc(sold.date))}${row("Sold for", money(num(sold.amount)))}${row("Shipping", num(sold.shipping) == null ? null : money(num(sold.shipping)))}${row("Insurance", num(sold.insurance) == null ? null : money(num(sold.insurance)))}${row("Where", esc(whereText(sold)))}${row("Sold to", esc(sold.to))}</div>` : ""}
    ${caseCard(c)}
    ${c.notes ? `<div class="card"><div class="muted small">Notes</div><div style="white-space:pre-wrap">${esc(c.notes)}</div></div>` : ""}
    ${certUrl(c) ? `<a class="btn block" style="display:block;text-align:center;text-decoration:none;color:inherit;margin-bottom:8px" href="${esc(certUrl(c))}" target="_blank" rel="noopener">Verify cert on ${esc(c.service)} ↗</a>` : ""}
    <a class="btn block" style="display:block;text-align:center;text-decoration:none;color:inherit" href="${esc(ebayUrl(c))}" target="_blank" rel="noopener">Check eBay sold ↗</a>
    <div class="btn-row">
      <button class="btn primary" data-act="edit" data-id="${esc(c.id)}">Edit</button>
      ${c.status === "owned" ? `<button class="btn" data-act="sell" data-id="${esc(c.id)}">Mark as sold</button>` : c.status === "gone" ? `<button class="btn" data-act="ungone" data-id="${esc(c.id)}">Move back to collection</button>` : `<button class="btn" data-act="editSale" data-id="${esc(c.id)}">Edit sale</button><button class="btn" data-act="unsell" data-id="${esc(c.id)}">Move back to collection</button>`}
      <button class="btn danger" data-act="delete" data-id="${esc(c.id)}">Delete</button>
    </div>`;
}

/* --- Albums --- */
const albumTitle = (a) => a.name || [a.brand, a.number].filter(Boolean).join(" ") || "Album";
// A slot is one spot in an album: year, mint mark, and optionally a variety (e.g. "8 Tail Feathers").
// Type-set spots ("set") hold one coin of a type, any date. "tx" marks a date spot shared by two of the album's types.
// "pf" marks a proof spot (only a coin with a PR grade fills it).
const slotKey = (s) => (s.set ? "set:" + s.t : s.y + "|" + s.m) + (s.v ? "|" + s.v : "") + (s.pf ? "|PF" : "") + (s.tx ? "#" + s.t : "");
const slotLabel = (s) => (s.set ? (TYPE_BY_ID[s.t] ? shortName(TYPE_BY_ID[s.t]) : "Coin") : s.y + (s.m ? "-" + s.m : "") + (s.pf ? " Proof" : ""));
// Years Red Book lists proofs for a type. US proofs moved from Philadelphia (no mint mark) to San Francisco in 1968.
const proofYears = (typeId) => { const p = PRICE_BOOK.series[typeId] && PRICE_BOOK.series[typeId].proof; return p ? [...new Set(Object.keys(p.rows).map((k) => +k.split("|")[0].split("-")[0]))].sort((x, y) => x - y) : []; };
const proofMint = (typeId, y) => { const p = PRICE_BOOK.series[typeId].proof.rows; const k = Object.keys(p).find((x) => x.split("|")[0].startsWith(y + "-")); return k ? normMint(k.split("|")[0].split("-")[1]) : y >= 1968 ? "S" : ""; };
const hasProofs = (types) => types.some((id) => proofYears(id).length);
// An album can hold several coin types (e.g. Washington silver 1932–1964 and clad 1965 on, or a type set).
const albumTypes = (a) => (a && a.typeIds && a.typeIds.length ? a.typeIds : a && a.typeId ? [a.typeId] : []).filter((id) => TYPE_BY_ID[id]);
const albumHasType = (a, typeId) => albumTypes(a).includes(typeId);
const isSetAlbum = (a) => !!a && a.layout === "set";
const albumTypeText = (a) => albumTypes(a).map((id) => TYPE_BY_ID[id].name).join(", ");
// The coin type a spot is for: its own, or the album type made in that spot's year.
function slotType(a, s) {
  if (s && s.t) return s.t;
  const ts = albumTypes(a);
  if (ts.length <= 1) return ts[0] || (a && a.typeId) || "";
  const y = num(s && s.y);
  return ts.find((id) => { const t = TYPE_BY_ID[id]; return y >= t.start && y <= typeLastYear(t); }) || ts[0];
}
// The spot a tapped album card stands for (by id, or by date for older cards).
function spotFromEl(a, el) {
  const d = el.dataset || el;
  const ss = (a && a.slots) || [];
  return (d.sid && ss.find((x) => x.id === d.sid)) || ss.find((x) => String(x.y) === String(d.y) && (x.m || "") === (d.m || "") && (x.v || "") === (d.v || "")) || { y: num(d.y), m: d.m || "", v: d.v || "" };
}
// Every standard spot for these types: dates and mint marks inside the years, or one spot per type for a type set.
function buildAlbumSlots(types, layout, start, end, proofs) {
  if (layout === "set") return types.map((id) => ({ id: uid(), set: true, t: id, y: "", m: "" }));
  const out = [], seen = new Set();
  types.forEach((id) => {
    const t = TYPE_BY_ID[id];
    if (!t) return;
    buildSlots(id, Math.max(start, t.start), Math.min(end, typeLastYear(t))).forEach((s) => {
      const k = s.y + "|" + s.m;
      out.push(seen.has(k) ? { ...s, t: id, tx: true } : { ...s, t: id });
      seen.add(k);
    });
    // Proof spots come after the regular spots for the same year.
    // proofs: "s" = San Francisco proofs only (1968 on), "all" = every proof year.
    if (proofs) proofYears(id).filter((y) => y >= Math.max(start, t.start) && y <= Math.min(end, typeLastYear(t))).forEach((y) => {
      const m = proofMint(id, y);
      if (proofs === "s" && m !== "S") return;
      const k = y + "|" + m + "|PF";
      out.push(seen.has(k) ? { id: uid(), y, m, pf: true, t: id, tx: true } : { id: uid(), y, m, pf: true, t: id });
      seen.add(k);
    });
  });
  return sortSlots(out);
}
function albumSlots(a) {
  const removed = new Set(a.removed || []);
  return (a.slots || []).filter((s) => !removed.has(slotKey(s)));
}
// Does this coin's variety fit a variety spot? "7 Over 8 Tail Feathers, Strong" fits "7 over 8 tail feathers".
function varietyFits(coinVar, slotVar) {
  const c = String(coinVar || "").toLowerCase().trim(), v = String(slotVar || "").toLowerCase().trim();
  return !!c && !!v && (c === v || c.startsWith(v) || v.startsWith(c));
}
// Short grade for an album card: "VF-20", "PCGS MS-63", or "owned" when no grade was entered.
function slotGrade(c) {
  const g = c.grade === "Other" ? c.customGrade : c.grade;
  if (!g) return "owned";
  return c.gradeMode === "cert" ? [c.service === "Other" ? c.customService : c.service, g].filter(Boolean).join(" ") : g;
}
// Years always stay in order; within a year, spots keep the order you gave them.
function sortSlots(slots) {
  return slots.map((x, i) => [x, i]).sort((a, b) => a[0].y - b[0].y || a[1] - b[1]).map((p) => p[0]);
}
// Give every spot a stable id (older albums were saved without them). Returns the album, with ids.
function withSlotIds(a) {
  if (!a || (a.slots || []).every((s) => s.id)) return a;
  const b = { ...a, slots: (a.slots || []).map((s) => (s.id ? s : { ...s, id: uid() })) };
  put("a_" + b.id, b);
  return b;
}
function buildSlots(typeId, start, end) {
  const t = TYPE_BY_ID[typeId];
  if (!t) return [];
  const out = [];
  if (EXACT_SLOTS[typeId]) {
    EXACT_SLOTS[typeId].forEach(([y, ms]) => {
      if (y < start || y > end) return;
      ms.split(" ").forEach((m) => {
        // Some dates have a spot per variety (e.g. 1909 VDB, the four 2009 designs); "" is the plain spot.
        const vs = (t.varieties && t.varieties[y + "|" + normMint(m)]) || [""];
        vs.forEach((v) => out.push(v ? { id: uid(), y, m: normMint(m), v } : { id: uid(), y, m: normMint(m) }));
      });
    });
  } else {
    for (let y = start; y <= end; y++) t.mints.forEach((m) => out.push({ id: uid(), y, m: normMint(m) }));
  }
  return out;
}
function albumStats(a) {
  const coins = ownedCoins().filter((c) => c.albumId === a.id);
  const slots = albumSlots(a);
  const filled = new Map();
  const used = new Set();
  const multi = albumTypes(a).length > 1 || isSetAlbum(a);
  // Does this coin fit this spot? Type sets match by type; date spots by date (and type, if the album has several).
  const pfOk = (c, s) => (s.pf ? isProofGrade(c.grade) : !(a.proofs && isProofGrade(c.grade)));
  const sameDate = (c, s) => (s.set ? c.typeId === s.t : num(c.year) === s.y && normMint(c.mint) === s.m && (!multi || c.typeId === slotType(a, s)) && pfOk(c, s));
  // 1) Coins added to a specific spot stay in that spot, whatever it's renamed or moved to.
  slots.forEach((s) => {
    if (!s.id) return;
    const hit = coins.find((c) => !used.has(c.id) && c.slotId === s.id && sameDate(c, s));
    if (hit) { filled.set(slotKey(s), hit); used.add(hit.id); }
  });
  // 2) Other coins: variety spots by matching variety, then plain spots by date.
  slots.filter((s) => s.v && !filled.has(slotKey(s))).forEach((s) => {
    const hit = coins.find((c) => !used.has(c.id) && sameDate(c, s) && (varietyFits(c.variety, s.v) || varietyFits(c.spotVariety, s.v)));
    if (hit) { filled.set(slotKey(s), hit); used.add(hit.id); }
  });
  slots.filter((s) => !s.v && !filled.has(slotKey(s))).forEach((s) => {
    const hit = coins.find((c) => !used.has(c.id) && sameDate(c, s) && !(c.slotId && slots.some((x) => x.id === c.slotId))) || null;
    if (hit) { filled.set(slotKey(s), hit); used.add(hit.id); }
  });
  return {
    coins, slots, filled,
    owned: filled.size, total: slots.length,
    value: sum(coins, (c) => (bestEach(c) || 0) * qtyOf(c)),
    melt: sum(coins, (c) => (meltEach(c) || 0) * qtyOf(c)),
  };
}
const albumsView = { reorder: false };
// The albums list as units: a single album, or a whole series kept together.
function albumUnits() {
  const list = albums(), key = albumSeriesKeys(list), units = [];
  list.forEach((a) => {
    const k = key.get(a.id), last = units[units.length - 1];
    if (k && last && last.key === k) last.items.push(a); else units.push({ key: k || null, items: [a] });
  });
  return units;
}
// Move one album (within its series) or a whole series (d = -1 up, 1 down).
function moveAlbum(id, d, whole) {
  const units = albumUnits();
  const ui = units.findIndex((u) => u.items.some((a) => a.id === id));
  if (ui < 0) return;
  if (whole || units[ui].items.length === 1) {
    const uj = ui + d;
    if (uj < 0 || uj >= units.length) return;
    [units[ui], units[uj]] = [units[uj], units[ui]];
  } else {
    const it = units[ui].items, i = it.findIndex((a) => a.id === id), j = i + d;
    if (j < 0 || j >= it.length) return;
    [it[i], it[j]] = [it[j], it[i]];
  }
  saveSettings({ albumOrder: units.flatMap((u) => u.items.map((a) => a.id)) });
}
const albumSub = (a) => [a.name ? [a.brand !== "Other" ? a.brand : "", a.number].filter(Boolean).join(" ") : "", isSetAlbum(a) ? "Type set" : albumTypeText(a)].filter(Boolean).join(" · ");
function viewAlbums() {
  const list = albums();
  const units = albumUnits();
  const mv = (id, i, n, whole) => `<span class="slot-mv"><button data-act="moveAlbum" data-id="${esc(id)}" ${whole ? "data-whole=\"1\"" : ""} data-d="-1" ${i ? "" : "disabled"} aria-label="Move up">▲</button><button data-act="moveAlbum" data-id="${esc(id)}" ${whole ? "data-whole=\"1\"" : ""} data-d="1" ${i < n - 1 ? "" : "disabled"} aria-label="Move down">▼</button></span>`;
  if (albumsView.reorder && list.length) {
    return `<h1>Albums</h1>
      <div class="banner" style="margin:0 0 10px">Use ▲ ▼ to put your albums in the order you want. Albums in a series move together; use the arrows inside a series to change its order.</div>
      ${units.map((u, ui) => u.key
        ? `<div class="series-box"><div class="series-head"><b>${esc(seriesTitle(u.items))}</b>${mv(u.items[0].id, ui, units.length, true)}</div>
            <div class="list">${u.items.map((a, i) => `<div class="coin-row"><span class="coin-main"><span class="coin-label">${esc(albumTitle(a))}</span><span class="coin-sub">${esc(albumSub(a))}</span></span>${mv(a.id, i, u.items.length)}</div>`).join("")}</div></div>`
        : `<div class="list" style="margin-bottom:10px"><div class="coin-row"><span class="coin-main"><span class="coin-label">${esc(albumTitle(u.items[0]))}</span><span class="coin-sub">${esc(albumSub(u.items[0]))}</span></span>${mv(u.items[0].id, ui, units.length, true)}</div></div>`).join("")}
      <button class="btn primary block" style="margin-top:12px" data-act="reorderAlbums">Done</button>`;
  }
  const card = (a) => {
    const st = albumStats(a);
    const done = st.total && st.owned === st.total;
    const numLine = a.name && (a.brand !== "Other" || a.number) ? [a.brand !== "Other" ? a.brand : "", a.number && "No. " + a.number].filter(Boolean).join(" ") : "";
    return `<button class="card" style="display:block;width:100%;text-align:left" data-go="album-${esc(a.id)}">
        <div style="display:flex;justify-content:space-between;gap:10px"><b>${esc(albumTitle(a))}${done ? `<span class="check" aria-label="Complete">✓</span>` : ""}</b><span class="num">${st.owned}/${st.total}</span></div>
        ${numLine ? `<div class="small">${esc(numLine)}</div>` : ""}
        <div class="small muted">${esc(isSetAlbum(a) ? "Type set · " + albumTypes(a).length + " types" : albumTypeText(a))}${a.start ? " · " + a.start + "–" + a.end : ""} · ${money(st.value, "$0.00")}</div>
        <div class="bar"><i style="width:${st.total ? (st.owned / st.total) * 100 : 0}%"></i></div></button>`;
  };
  return `<h1>Albums</h1>
    <button class="btn primary block" data-act="newAlbum">+ New album</button>
    ${list.length > 1 ? `<div style="text-align:right;margin-top:8px"><button class="link-btn" data-act="reorderAlbums">Reorder albums</button></div>` : ""}
    <div style="margin-top:12px">${list.length ? units.map((u) => u.key ? `<div class="series-box"><div class="series-head"><b>${esc(seriesTitle(u.items))}</b></div>${u.items.map(card).join("")}</div>` : card(u.items[0])).join("") : `<div class="card empty">No albums yet. Make one here, or pick an album number when you add a coin.</div>`}</div>`;
}
const albumEdit = { id: null };
function viewAlbum(r) {
  const a = getAlbum(r.id);
  if (!a) return `<div class="card empty">That album isn't here. <button class="link-btn" data-go="albums">Back to Albums</button></div>`;
  const st = albumStats(a);
  const done = st.total && st.owned === st.total;
  const editing = albumEdit.id === a.id;
  const extras = st.coins.filter((c) => ![...st.filled.values()].includes(c));
  return `<button class="link-btn" data-go="albums">← Albums</button>
    <h1 style="margin-top:10px">${esc(albumTitle(a))}${done ? `<span class="check" aria-label="Complete">✓</span>` : ""}</h1>
    <div class="small muted" style="margin:-8px 0 12px">${esc([a.brand, a.number && "No. " + a.number, isSetAlbum(a) ? "Type set" : albumTypeText(a)].filter(Boolean).join(" · "))}${a.start ? " · " + a.start + "–" + a.end : ""}</div>
    <div class="stats">
      <div class="stat"><div class="k">Owned</div><div class="v">${st.owned}/${st.total}</div></div>
      <div class="stat"><div class="k">Missing</div><div class="v">${st.total - st.owned}</div><button class="link-btn small" data-act="missing" data-id="${esc(a.id)}">Show missing</button></div>
      <div class="stat"><div class="k">Album value</div><div class="v">${money(st.value, "$0.00")}</div></div>
      <div class="stat"><div class="k">Album melt</div><div class="v">${money(st.melt, "$0.00")}</div></div>
    </div>
    <div class="bar" style="margin:12px 0 16px"><i style="width:${st.total ? (st.owned / st.total) * 100 : 0}%"></i></div>
    <div class="btn-row" style="margin:0 0 12px">
      <button class="btn" data-act="addSpot" data-id="${esc(a.id)}">+ Add a spot</button>
      <button class="btn ${editing ? "primary" : ""}" data-act="editSlots" data-id="${esc(a.id)}">${editing ? "Done editing" : "Edit spots"}</button>
    </div>
    ${editing ? `<div class="banner" style="margin:0 0 10px">Use ◀ ▶ to put spots in the same order as your album (within each year). Tap a spot to rename its label, or hide or remove it.</div>` : ""}
    <div class="album-grid">${(editing ? a.slots || [] : st.slots).map((s, i, arr) => {
      const k = slotKey(s);
      const hit = st.filled.get(k);
      const gone = (a.removed || []).includes(k);
      const lab = slotLabel(s);
      const vLine = s.v ? `<span class="g" style="font-weight:600;color:var(--ink)">${esc(s.v)}</span>` : "";
      const data = `data-album="${esc(a.id)}" data-sid="${esc(s.id || "")}" data-y="${s.y}" data-m="${esc(s.m)}" data-v="${esc(s.v || "")}"`;
      if (editing) {
        const canL = i > 0 && arr[i - 1].y === s.y, canR = i < arr.length - 1 && arr[i + 1].y === s.y;
        return `<div class="slot slot-edit" style="${s.custom ? "border-color:var(--accent);" : ""}${gone ? "opacity:.4;" : ""}">
          <button class="slot-name" data-act="spotEdit" data-id="${esc(a.id)}" data-i="${i}" style="${gone ? "text-decoration:line-through" : ""}">${esc(lab)}${vLine}<span class="g">${gone ? "hidden" : s.custom ? "added" : "edit"}</span></button>
          ${canL || canR ? `<span class="slot-mv"><button data-act="moveSpot" data-id="${esc(a.id)}" data-i="${i}" data-d="-1" ${canL ? "" : "disabled"} aria-label="Move earlier">◀</button><button data-act="moveSpot" data-id="${esc(a.id)}" data-i="${i}" data-d="1" ${canR ? "" : "disabled"} aria-label="Move later">▶</button></span>` : ""}
        </div>`;
      }
      const onList = spotFindWant(a, s);
      const tag = onList ? `<span class="g" style="color:var(--accent)">★ wanted</span>` : "";
      return hit
        ? `<button class="slot have" data-act="slotMenu" ${data} data-coin="${esc(hit.id)}">${esc(lab)}${vLine}<span class="g">${esc(slotGrade(hit))}</span>${tag}</button>`
        : `<button class="slot" data-act="slotMenu" ${data}>${esc(lab)}${vLine}${tag || `<span class="g">open</span>`}</button>`;
    }).join("")}</div>
    ${extras.length ? `<h2>Also in this album</h2><div class="list">${extras.map((c) => coinRow(c)).join("")}</div>` : ""}
    <div class="btn-row">
      <button class="btn" data-act="editAlbum" data-id="${esc(a.id)}">Edit album</button>
      <button class="btn danger" data-act="deleteAlbum" data-id="${esc(a.id)}">Delete album</button>
    </div>
    <p class="small muted">${isSetAlbum(a) ? "One spot per coin type. Any date fills it." : albumTypes(a).every((id) => EXACT_SLOTS[id]) ? "Spots follow the dates and mint marks this series was struck." : "Spots include every year and mint mark for this series. Use Edit spots to hide any your album doesn't have."} If your album has a spot that's missing here, like a variety, use <b>+ Add a spot</b>.</p>`;
}

/* --- Editing one spot: rename its label, hide/show, or remove --- */
function openSpotEdit(id, i) {
  const a = getAlbum(id);
  const s = a && (a.slots || [])[i];
  if (!s) return;
  const k = slotKey(s);
  const gone = (a.removed || []).includes(k);
  const opts = s.set ? [] : spotVarietyOptions(a, s.y, s.m, slotType(a, s));
  openSheet(`<div class="sheet-head"><h2>${esc(slotLabel(s))}${s.v ? " · " + esc(s.v) : ""}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <form id="spotEditForm" data-id="${esc(a.id)}" data-i="${i}">
      <label class="f"><span>Variety or label (optional)</span><input type="text" name="v" id="spotV" list="spotVList" value="${esc(s.v || "")}" placeholder="e.g. 7 Tail Feathers" maxlength="60"></label>
      <datalist id="spotVList">${opts.map((o) => `<option value="${esc(o)}">`).join("")}</datalist>
      ${opts.length ? `<div class="hint">Red Book varieties for this date: ${opts.map((o) => `<button type="button" class="link-btn" data-act="pickSpotV" data-v="${esc(o)}">${esc(o)}</button>`).join(", ")}</div>` : ""}
      <div class="btn-row"><button class="btn primary" type="submit">Save</button>
        ${s.custom
          ? `<button class="btn danger" type="button" data-act="deleteSpot" data-id="${esc(a.id)}" data-k="${esc(k)}">Remove spot</button>`
          : `<button class="btn" type="button" data-act="toggleSlot" data-id="${esc(a.id)}" data-k="${esc(k)}">${gone ? "Show spot" : "Hide spot"}</button>`}
      </div>
    </form>`);
}
function saveSpotEdit(form) {
  const a = withSlotIds(getAlbum(form.dataset.id));
  const i = +form.dataset.i;
  const s = a && (a.slots || [])[i];
  if (!s) return;
  const v = String(new FormData(form).get("v") || "").trim();
  const next = { ...s, v };
  if (!v) delete next.v;
  const oldK = slotKey(s), newK = slotKey(next);
  if (newK !== oldK && (a.slots || []).some((x, j) => j !== i && slotKey(x) === newK)) { toast("There's already a spot with that label for this date."); return; }
  const slots = (a.slots || []).slice();
  slots[i] = next;
  const removed = (a.removed || []).map((x) => (x === oldK ? newK : x));
  put("a_" + a.id, { ...a, slots, removed });
  closeSheet();
  toast("Spot saved.");
}

/* --- Adding your own spot to an album (e.g. 1878 8 Tail Feathers) --- */
function spotVarietyOptions(a, y, m, tid) {
  const s = a && PRICE_BOOK.series[tid || slotType(a, { y, m })];
  if (!s || !y) return [];
  const base = String(y) + (normMint(m) ? "-" + normMint(m) : "");
  const out = new Set();
  Object.values(s).forEach((tab) => Object.keys(tab.rows).forEach((k) => { const [b, v] = k.split("|"); if (v && b === base) out.add(v); }));
  return [...out];
}
function openAddSpot(id) {
  const a = getAlbum(id);
  if (!a) return;
  openSheet(`<div class="sheet-head"><h2>Add a spot</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <p class="small muted" style="margin-top:0">For a spot your album has that isn't shown, like a variety. A coin with a matching variety fills it.</p>
    <form id="spotForm" data-id="${esc(a.id)}">
      ${isSetAlbum(a) || albumTypes(a).length > 1 ? `<label class="f"><span>Coin type</span><select name="t">${albumTypes(a).map((id) => `<option value="${id}">${esc(TYPE_BY_ID[id].name)}</option>`).join("")}</select></label>
      <div class="hint">To add a type that isn't in this album yet, use Edit album.</div>` : ""}${isSetAlbum(a) ? "" : `<div class="grid2">
        <label class="f"><span>Year</span><input type="number" inputmode="numeric" name="y" id="spotY" required placeholder="${a.start}"></label>
        <label class="f"><span>Mint mark</span><select name="m" id="spotM">${MINTS.map((m) => `<option value="${m}">${m || "None (Philadelphia)"}</option>`).join("")}</select></label>
      </div>`}
      ${isSetAlbum(a) ? "" : `<label class="switch"><span>Proof spot</span><input type="checkbox" name="pf"></label>`}
      <label class="f"><span>Variety or label (optional)</span><input type="text" name="v" id="spotV" list="spotVList" placeholder="e.g. 8 Tail Feathers" maxlength="60"></label>
      <datalist id="spotVList"></datalist>
      <div class="hint" id="spotHint"></div>
      <div class="btn-row"><button class="btn primary" type="submit">Add spot</button><button class="btn" type="button" data-act="closeSheet">Cancel</button></div>
    </form>`);
}
function refreshSpotHints() {
  const f = $("#spotForm");
  if (!f) return;
  const a = getAlbum(f.dataset.id);
  if (!$("#spotY")) return;
  const opts = spotVarietyOptions(a, num($("#spotY").value), $("#spotM").value);
  $("#spotVList").innerHTML = opts.map((o) => `<option value="${esc(o)}">`).join("");
  $("#spotHint").innerHTML = opts.length ? "Red Book varieties for this date: " + opts.map((o) => `<button type="button" class="link-btn" data-act="pickSpotV" data-v="${esc(o)}">${esc(o)}</button>`).join(", ") : "";
}
function saveSpot(form) {
  const a = getAlbum(form.dataset.id);
  if (!a) return;
  const fd = new FormData(form);
  let spot;
  if (isSetAlbum(a)) {
    spot = { id: uid(), set: true, t: fd.get("t"), y: "", m: "", v: String(fd.get("v") || "").trim(), custom: true };
    if (!spot.v) { toast("Give the spot a label, like Bicentennial or 1909 VDB."); return; }
  } else {
    const y = num(fd.get("y"));
    if (!y || y < 1700 || y > thisYear()) { toast("Enter a year."); return; }
    spot = { id: uid(), y, m: normMint(fd.get("m") || ""), v: String(fd.get("v") || "").trim(), custom: true };
    if (fd.get("pf")) spot.pf = true;
    if (albumTypes(a).length > 1) {
      spot.t = fd.get("t") || slotType(a, spot);
      const tt = TYPE_BY_ID[spot.t];
      if (tt && (y < tt.start || y > typeLastYear(tt))) { toast(tt.name + " was made " + tt.start + "–" + typeLastYear(tt) + "."); return; }
      // Same date as another type's spot (e.g. 1921 Morgan and 1921 Peace): keep them apart.
      if ((a.slots || []).some((x) => slotKey(x) === slotKey({ ...spot, t: undefined }) && slotType(a, x) !== spot.t)) spot.tx = true;
    }
  }
  if (!spot.v) delete spot.v;
  const k = slotKey(spot);
  if ((a.slots || []).some((x) => slotKey(x) === k)) {
    const wasHidden = (a.removed || []).includes(k);
    if (wasHidden) put("a_" + a.id, { ...a, removed: (a.removed || []).filter((x) => x !== k) });
    closeSheet();
    toast(wasHidden ? "That spot was hidden. It's back now." : "That spot is already in the album.");
    return;
  }
  const all = [...(withSlotIds(a).slots || []), spot];
  put("a_" + a.id, { ...a, slots: isSetAlbum(a) ? all : sortSlots(all) });
  closeSheet();
  toast("Spot added: " + slotLabel(spot) + (spot.v ? " " + spot.v : "") + ".");
}

/* --- Photo guide --- */
function viewGuide() {
  return `<h1>PCGS Photo Guide</h1>
    <div class="card">PCGS Photograde shows photos of each coin type at every grade, so you can compare your coin side by side.
      <div class="btn-row"><a class="btn primary" style="text-align:center;text-decoration:none" href="https://www.pcgs.com/photograde" target="_blank" rel="noopener">Open PCGS Photograde ↗</a></div>
      <div class="hint">Opens in your browser.</div></div>
    <h2>Grades at a glance</h2>
    <div class="card">${GRADE_GUIDE.map(([g, d]) => `<div class="rowline" style="display:block"><b>${esc(g)}</b><div class="small muted">${esc(d)}</div></div>`).join("")}</div>`;
}

/* --- Options --- */
function viewOptions() {
  const s = settings();
  const del = deletedCoins().sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
  return `<h1>Options</h1>
    <h2>Spot prices</h2>
    <div class="card">
      ${SPOT_METALS.map((m) => `<label class="f"><span>${m.label} ($ per ${m.unit})</span><input type="number" inputmode="decimal" step="0.01" min="0" data-spot="${m.key}" value="${esc(s.spot[m.key] ?? "")}" placeholder="0.00"></label>`).join("")}
      <div class="hint">Type today's prices. <span id="spotStamp">${s.spotUpdated ? "Last updated " + esc(stampText(s.spotUpdated)) + "." : ""}</span> <a href="https://www.kitco.com/" target="_blank" rel="noopener">Look up current prices ↗</a></div>
    </div>
    <h2>Shelf style</h2>
    <div class="card"><div class="chips">${(typeof SHELF_STYLES !== "undefined" ? SHELF_STYLES : []).map(([k, n]) => { const on = shelfStyle() === k; return `<button class="chip ${on ? "on" : ""}" data-act="shelfStyle" data-v="${k}" aria-pressed="${on}">${on ? "✓ " : ""}${n}</button>`; }).join("")}</div>
      <div class="hint">Bookcase: wood shelves; at night only the page around it goes dark. Safe: steel walls, dark all the time.</div></div>
    <h2>Show on Home</h2>
    <div class="card">
      ${SPOT_METALS.map((m) => `<label class="switch"><span>${m.label} spot price</span><input type="checkbox" data-act="hideSpot" data-v="${m.key}" ${s.hideSpot[m.key] ? "" : "checked"}></label>`).join("")}
      <label class="switch"><span>Sold results<div class="small muted">Turns on by itself at your first sale.</div></span><input type="checkbox" data-act="showSold" ${s.showSold ? "checked" : ""}></label>
    </div>
    <h2>Red Book values</h2>
    <div class="card">${Object.keys(PRICE_BOOK.series).map((id) => `<div class="rowline"><span>${esc(TYPE_BY_ID[id] ? TYPE_BY_ID[id].name : id)}</span><span class="muted small">${Object.keys(PRICE_BOOK.series[id]).map((k) => ({ circ: "regular", fbl: "FBL", proof: "proof" }[k])).join(" · ")}</span></div>`).join("")}
      <label class="f"><span>Red Book edition</span><input type="text" data-setting="bookEdition" value="${esc(s.bookEdition || PRICE_BOOK.edition || "")}" placeholder="e.g. 2026"></label>
      <div class="hint">A coin with no value typed in uses its Red Book value. Coins below the lowest listed grade use melt.</div></div>
    <h2>Spreadsheet</h2>
    <div class="card">Save all your coins as a spreadsheet file (CSV), or add coins from one.
      <div class="btn-row"><button class="btn" data-act="export">Export CSV</button><button class="btn" data-act="openImport">Import CSV</button></div>
      ${s.lastImport && s.lastImport.ids ? `<div class="hint" style="margin-top:8px">Last import: ${s.lastImport.count} row${s.lastImport.count === 1 ? "" : "s"} on ${esc(s.lastImport.at)}. <button class="link-btn" data-act="undoImport">Remove them</button></div>` : ""}</div>
    <h2>Backup and restore</h2>
    <div class="card">${store.mode === "db" ? "Save everything, photos included, in one file. This is also how you move your coins into the Coin Cabinet app on your phone." : "Save everything, photos included, in one file, or bring coins in from a backup."}
      ${settings().lastBackup ? `<div class="small muted" style="margin-top:6px">Last backup: ${esc(settings().lastBackup)}</div>` : ""}
      <div class="btn-row"><button class="btn" data-act="openBackup">Backup and restore</button></div></div>
    <h2>Share Coin Cabinet</h2>
    <div class="card">Send someone the link so they can install Coin Cabinet. They get their own, separate collection: they can't see your coins, and you can't see theirs.
      <div class="btn-row"><button class="btn" data-act="shareApp">Share the app</button></div></div>
    <h2>Share a snapshot</h2>
    <div class="card">Save a view-only copy of your collection as one file to send to friends. What you paid, sources, notes and buyers are left out unless you choose to include them.
      <div class="btn-row"><button class="btn" data-act="openSnapshot">Share a snapshot</button></div></div>
    <h2>Insurance report</h2>
    <div class="card">A dated, itemized list of every coin you own with values and totals, ready to print or save as a PDF for your insurance agent.
      <div class="btn-row"><button class="btn" data-act="openReport">Create insurance report</button></div></div>
    <h2>Recently deleted</h2>
    ${del.length ? `<div class="list">${del.map((c) => `<div class="coin-row">${thumbHtml(c)}<span class="coin-main"><span class="coin-label">${esc(labelOf(c))}</span><span class="coin-sub">${esc(gradeText(c))}</span></span>
      <button class="btn" data-act="restore" data-id="${esc(c.id)}">Restore</button><button class="btn danger" data-act="purge" data-id="${esc(c.id)}" aria-label="Delete forever">✕</button></div>`).join("")}</div>` : `<div class="card empty">Nothing deleted.</div>`}
    <p class="small muted">Coin Cabinet version ${APP_VERSION}</p>
    <p class="small muted">${store.mode === "db" ? "Your coins are saved to your Claude account and are private to you." : store.mode === "local" ? "Your coins are saved on this device only, and are private to you. Save a backup now and then, in case the device is lost or reset." : "Practice mode: nothing is saved."}</p>`;
}

/* ---------- sheets (pop-ups) ---------- */
function openSheet(html, cls) {
  const w = $("#sheet");
  w.innerHTML = `<div class="sheet ${cls || ""}" role="dialog" aria-modal="true">${html}</div>`;
  w.hidden = false;
  document.body.style.overflow = "hidden";
}
function closeSheet() {
  const w = $("#sheet");
  w.hidden = true;
  w.innerHTML = "";
  document.body.style.overflow = "";
  draft = null;
}
// Escape or tapping outside: some pop-ups (like New want list) go back instead of closing.
function dismissSheet() { if (typeof sheetDismiss === "function" && sheetDismiss()) return; closeSheet(); }
$("#sheet").addEventListener("click", (e) => { if (e.target.id === "sheet") dismissSheet(); });

/* --- Add / edit coin --- */
let draft = null;
function blankCoin() {
  return { kind: "coin", id: uid(), status: "owned", typeId: "", typeName: "", family: "", denom: "", year: "", mint: "", gradeMode: "raw", grade: "", customGrade: "",
    service: "PCGS", customService: "", cert: "", metal: "", oz: "", qty: 1, paid: "", value: "", source: "", acquired: "", albumId: "", notes: "", holder: "", cac: "", coa: false, packaging: "", photos: [], fbl: false, sms: false, variety: "", label: "", labelEdited: false,
    stage: "", upgrade: false, seller: "", buyTax: "", buyShip: "", buyFees: "", payMethod: "", receiptNo: "", receiptPhotos: [],
    knownVar: "", mintErrors: [], problems: [], errorNote: "", catNo: "", createdAt: Date.now() };
}
function openCoinForm(id) {
  const existing = id ? getCoin(id) : null;
  draft = existing ? JSON.parse(JSON.stringify(existing)) : blankCoin();
  draft._isNew = !existing;
  if (!existing) { const s = settings(); draft.source = s.lastSource || ""; draft._lastHolder = s.lastHolder || ""; } // quick-add: remember last source and holder
  draft._newAlbum = { brand: "Whitman", number: "" };
  draft._status = statusKey(draft);
  draft._goneReason = (draft.gone && draft.gone.reason) || "";
  draft._goneDate = (draft.gone && draft.gone.date) || "";
  if (!Array.isArray(draft.receiptPhotos)) draft.receiptPhotos = [];
  renderCoinForm();
}
function sourceOptions() {
  const known = new Set(SOURCE_DEFAULTS.map((x) => x.toLowerCase()));
  return [...new Set([...SOURCE_DEFAULTS, ...allCoins().map((c) => (c.source || "").trim()).filter((x) => x && !known.has(x.toLowerCase()))])];
}
// First render of a coin: figure out whether its saved source is a known choice or custom text.
function initSourceKind(d) {
  if (d._sourceKind !== undefined) return;
  const canon = SOURCE_DEFAULTS.find((x) => x.toLowerCase() === (d.source || "").trim().toLowerCase()); // "Coin shop" saved before → "Coin Shop"
  if (canon) d.source = canon;
  d._sourceKind = !d.source ? "" : sourceOptions().includes(d.source) ? d.source : "Other";
}
// Mint marks offered for a type. Proofs have their own list: e.g. West Point (W) proofs of Silver Eagles.
function proofMintsOf(t) {
  if (t.proofMints) return t.proofMints;
  return t.end < 1968 ? ["P"] : t.start >= 1968 ? ["S"] : ["P", "S"]; // US proofs moved from Philadelphia to San Francisco in 1968
}
function mintChoices(t, proof) {
  if (!t) return MINTS;
  const ms = proof ? proofMintsOf(t) : t.mints;
  return ["", ...ms.filter((m) => m !== "P"), ...(!proof && ms.includes("P") ? ["P"] : [])];
}
// Closed-by-default section. It stays open (or closed) as you left it, even when the form redraws.
function sec(key, title, body, hasData) {
  const o = draft._open && draft._open[key];
  const open = o !== undefined ? o : !!hasData && !draft._isNew; // new coins start with every section closed
  return `<details data-sec="${key}" ${open ? "open" : ""}><summary>${title}</summary>${body}</details>`;
}
function whatPicker() {
  return openSheet(`<div class="sheet-head"><h2>Add coin</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
  ${store.mode === "snapshot" ? `<div class="banner" style="margin:0 0 6px">Try it out. This copy doesn't save, so coins added here disappear when the page is closed.</div>` : ""}
  <div class="f"><span>What is it?</span></div>
  <button type="button" class="btn block what-btn" data-act="what" data-v="us"><b>US coin</b><small>Cent to dollar, loose or in a holder</small></button>
  <button type="button" class="btn block what-btn" data-act="what" data-v="set"><b>Proof or mint set</b><small>One entry for the whole set</small></button>
  <button type="button" class="btn block what-btn" data-act="what" data-v="roll"><b>Roll of coins</b><small>Bank roll, tube or mint-sealed roll</small></button>
  <button type="button" class="btn block what-btn" data-act="what" data-v="bullion"><b>Silver bar, round or other item</b><small>Bullion that goes in a stack</small></button>
  <button type="button" class="btn block what-btn" data-act="what" data-v="other"><b>Medal, token or foreign coin</b><small>Anything that isn't a US coin from the Red Book</small></button>`, "sheet-75");
}
function renderCoinForm() {
  const d = draft;
  const it = itemOf(d);
  const noun = it === "set" ? "set" : it === "roll" ? "roll" : "coin";
  if (d._isNew && !d.typeId && !d.typeName && !d._what) return whatPicker();
  document.querySelectorAll(`#coinForm[data-coin="${d.id}"] details[data-sec]`).forEach((x) => { (d._open = d._open || {})[x.dataset.sec] = x.open; }); // keep sections as you left them
  const t = TYPE_BY_ID[d.typeId];
  const other = it !== "bullion" && (d._isNew && !d.typeId && d._what === "other" || !d._isNew && !t);
  if (d.grade && d.grade !== "Other") d._proof = isProofGrade(d.grade); // a grade that's set decides the switch
  else if (d._proof === undefined) d._proof = false;
  const mints = mintChoices(t, d._proof).concat(d.mint && !mintChoices(t, d._proof).includes(d.mint) ? [d.mint] : []); // keep an older saved mint visible
  const grades = (d.gradeMode === "cert" ? CERT_GRADES : GRADES).filter((g) => isProofGrade(g) === !!d._proof);
  const melt = meltEach(d);
  initSourceKind(d);
  const h = formHolder(d);
  const typeBlock = !d._isNew
    ? `<div class="f"><span>Coin type</span><div class="locked-type"><b>${esc(t ? t.name : d.typeName || "Custom coin")}</b>${d.denom ? ` <span class="muted small">${esc(d.denom)}</span>` : ""}</div>
      <div class="hint">The coin type can't change once a coin is saved. <button type="button" class="link-btn" data-act="retype">Wrong type? Re-add it</button></div></div>`
    : other
      ? `${otherPicker(d)}<label class="f"><span>Kind</span><select data-f="family" data-rerender><option value="">Choose…</option>${OTHER_KINDS.map((k) => `<option ${d.family === k ? "selected" : ""}>${k}</option>`).join("")}</select></label>
      <div class="grid2">
      <label class="f"><span>What is it called?</span><input type="text" data-f="typeName" value="${esc(d.typeName)}" placeholder="e.g. Casino token"></label>
      <label class="f"><span>Face value</span><input type="text" data-f="denom" value="${esc(d.denom)}" placeholder="$1"></label></div>`
      : `<div class="f typeahead"><span>Coin type</span>
      <input type="search" id="typeSearch" placeholder="Search by name, e.g. Morgan" value="${esc(t ? t.name : "")}">
      <div class="ta-list" id="typeList" hidden></div>
      <div class="hint"><button type="button" class="link-btn" data-act="what" data-v="other">Can't find it? Type it yourself</button></div>
    </div>`;
  openSheet(`<div class="sheet-head"><h2>${d._isNew ? (d._stay ? "Add coin to album" : "Add " + noun) : "Edit " + noun}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
  ${store.mode === "snapshot" ? `<div class="banner" style="margin:0 0 6px">Try it out. This copy doesn't save, so coins added here disappear when the page is closed.</div>` : ""}
  <form id="coinForm" data-coin="${d.id}" autocomplete="off">
    ${sampleApi && d._isNew && !other && it === "coin" ? photoFillButton(d) : ""}
    ${it === "bullion" ? bullionTopHtml(d) : it === "set" ? setTopHtml(d) : `${typeBlock}
    ${t && t.note ? `<div class="hint">${esc(t.note)}</div>` : ""}
    <div class="grid2">
      <label class="f"><span>Year</span><input type="number" inputmode="numeric" data-f="year" value="${esc(d.year)}" placeholder="${t ? t.start + "–" + typeLastYear(t) : "1921"}"></label>
      ${other ? "" : `<label class="f"><span>Mint mark</span><select data-f="mint">${mints.map((m) => `<option value="${m}" ${d.mint === m ? "selected" : ""}>${m || "None (Philadelphia)"}</option>`).join("")}</select></label>`}
    </div>
    <div class="hint" id="yearHint" style="color:var(--bad)">${esc(yearProblem(d.typeId, d.year, "coin"))}</div>`}
    ${it === "roll" ? rollFields(d) : ""}

    ${it !== "coin" ? "" : `<fieldset><legend>Grade</legend>
      <div class="seg"><button type="button" data-act="gmode" data-v="raw" class="${d.gradeMode === "raw" ? "on" : ""}">Raw</button><button type="button" data-act="gmode" data-v="cert" class="${d.gradeMode === "cert" ? "on" : ""}">Certified</button></div>
      ${d.gradeMode === "cert" ? `<div class="grid2">
        <label class="f"><span>Grading service</span><select data-f="service" data-rerender>${SERVICES.map((s) => `<option ${d.service === s ? "selected" : ""}>${s}</option>`).join("")}</select></label>
        <label class="f"><span>Cert number</span><input type="text" inputmode="numeric" data-f="cert" value="${esc(d.cert)}"></label></div>
        ${d.service === "Other" ? `<label class="f"><span>Service name</span><input type="text" data-f="customService" value="${esc(d.customService)}"></label>` : ""}
        <div class="grid2"><label class="f"><span>CAC sticker</span><select data-f="cac"><option value="">None</option><option ${d.cac === "Green" ? "selected" : ""}>Green</option><option ${d.cac === "Gold" ? "selected" : ""}>Gold</option></select></label>
        <label class="f"><span>Catalog number (optional)</span><input type="text" data-f="catNo" value="${esc(d.catNo || "")}" placeholder="From the label, e.g. 7172" maxlength="20"></label></div>
        <div class="hint">The ${d.service === "NGC" ? "NGC" : "PCGS"} coin number printed on the slab's label. Later it opens this exact coin in the PCGS Photo Guide.</div>` : ""}
      <label class="switch"><span>Proof<div class="small muted">Mirror-finish coin made for collectors. Shows proof grades (PR) and the mints that struck proofs.</div></span><input type="checkbox" data-act="toggleProof" ${d._proof ? "checked" : ""}></label>
      <label class="f"><span>${d.gradeMode === "cert" ? "Grade on the holder" : "My estimated grade"}</span>
        <select data-f="grade" data-rerender><option value="">Choose…</option>${grades.map((g) => `<option ${d.grade === g ? "selected" : ""}>${g}</option>`).join("")}<option value="Other" ${d.grade === "Other" ? "selected" : ""}>Other…</option></select></label>
      ${d.grade === "Other" ? `<label class="f"><span>Custom grade</span><input type="text" data-f="customGrade" value="${esc(d.customGrade)}" placeholder="e.g. VF details, cleaned"></label>` : ""}
      ${isJunk(d) ? `<div class="hint">Junk coins are valued at melt.</div>` : ""}
      <div class="hint"><a id="pcgsLink" href="${esc(photoGuideUrl(d))}" target="_blank" rel="noopener">${esc(photoGuideText(d))} ↗</a></div>
      ${it === "coin" && (d.typeName || d.year) ? `<div class="hint"><a id="ebayLink" href="${esc(ebayUrl(d))}" target="_blank" rel="noopener">Check eBay sold ↗</a></div>` : ""}
      ${PRICE_BOOK.series[d.typeId] && PRICE_BOOK.series[d.typeId].fbl && !isProofGrade(d.grade) ? `<label class="switch"><span>Full Bell Lines (FBL)<div class="small muted">All the lines on the Liberty Bell are complete.</div></span><input type="checkbox" data-fcheck="fbl" ${d.fbl ? "checked" : ""}></label>` : ""}
      <div id="smsBox">${smsField(d)}</div>
      <div id="varietyBox">${varietyField(d)}</div>
    </fieldset>`}

    ${sec("value", "Quantity, value and metal", `<div class="grid2">
      <label class="f"><span>Quantity</span><input type="number" inputmode="numeric" min="1" data-f="qty" value="${esc(d.qty)}"></label>
      <label class="f"><span>Value${eachWord(d)}</span><input type="number" inputmode="decimal" step="0.01" data-f="value" value="${esc(isJunk(d) ? "" : d.value)}" placeholder="${isJunk(d) ? "melt" : "$"}" ${isJunk(d) ? "disabled" : ""}></label>
    </div>
    <div class="hint" id="bookHint">${esc(bookHintText(d))}</div>
    ${it === "bullion" ? "" : `<div class="grid2">
      ${it === "set" ? "" : `<label class="f"><span>Metal</span><select data-f="metal" data-rerender><option value="">Choose…</option>${METALS.map((m) => `<option ${d.metal === m ? "selected" : ""}>${m}</option>`).join("")}</select></label>`}
      <label class="f"><span>${it === "set" ? "Silver in the set (oz)" : it === "roll" ? "Metal content per coin (oz)" : "Metal content (oz)"}</span><input type="number" inputmode="decimal" step="0.00001" data-f="oz" value="${esc(d.oz)}" placeholder="0.77344"></label>
    </div>`}
    ${other ? gramsHelper(d) : ""}
    <div class="hint" id="meltHint">${esc(meltHintText(d))}</div>`, num(d.qty) > 1 || d.value || (other && d.metal))}

    ${sec("status", "Status" + (d._status && d._status !== "owned" ? ` <span class="muted small">· ${esc(STATUS_TEXT[d._status] || "")}</span>` : ""), statusFields(d), (d._status && d._status !== "owned") || d.upgrade || d.status === "sold")}

    ${sec("holder", (it === "coin" ? "Holder and album" : it === "set" ? "Packaging" : "Holder") + (h ? ` <span class="muted small">· ${esc(h)}</span>` : ""), `${it !== "coin" ? "" : `<label class="f"><span>Album</span><select data-f="albumId" data-rerender><option value="">Not in an album</option>${albumsForCoin(d).map((a) => `<option value="${esc(a.id)}" ${d.albumId === a.id ? "selected" : ""}>${esc(albumTitle(a))}</option>`).join("")}<option value="__new" ${d.albumId === "__new" ? "selected" : ""}>+ New album…</option></select></label>
    ${d.albumId === "__new" ? `<div class="grid2">
      <label class="f"><span>Brand</span><select data-na="brand">${ALBUM_BRANDS.map((b) => `<option ${d._newAlbum.brand === b ? "selected" : ""}>${b}</option>`).join("")}</select></label>
      <label class="f"><span>${d._newAlbum.brand === "Other" ? "Album name" : "Album number"}</span><input type="text" data-na="number" value="${esc(d._newAlbum.number)}" placeholder="${d._newAlbum.brand === "Dansco" ? "7070" : d._newAlbum.brand === "Whitman" ? "9128" : "My Morgans"}"></label></div>
      <div class="hint">Makes a virtual album for this coin type with every date and mint mark. Change its name or date range later with Edit album on the album's page.</div>` : ""}`}
    ${holderFields(d)}`, d.albumId || d.holder || d.coa || d.packaging || d.stack || d.boxId)}

    ${purchaseFields(d)}

    ${it === "coin" ? errorFields(d) : ""}

    ${sec("photos", `Photos (${(d.photos || []).length})`, `<div class="photos">${(d.photos || []).map((p, i) => `<div class="ph"><img src="${esc(photoSrc(p))}" alt=""><button type="button" class="rm" data-act="rmPhoto" data-i="${i}" aria-label="Remove photo">✕</button></div>`).join("")}</div>
      <label class="btn file-btn" style="display:inline-block;margin-top:10px">Add photos<input type="file" accept="image/*" multiple id="photoInput"></label>
      <div class="hint" id="photoHint">${store.mode === "db" && !assetsApi ? "Photos can't be saved from this view." : ""}</div>`, (d.photos || []).length)}

    ${sec("notes", "Notes and label", `<label class="f"><span>Notes</span><textarea data-f="notes">${esc(d.notes)}</textarea></label>
      <label class="f"><span>Label</span><input type="text" id="labelInput" data-f="label" value="${esc(d.labelEdited ? d.label : autoLabel(d))}"></label>
      <div class="hint">Fills in as date-mint mark, coin type, denomination. Type over it to use your own.${d.labelEdited ? ` <button type="button" class="link-btn" data-act="resetLabel">Use automatic label</button>` : ""}</div>`, d.notes || d.labelEdited)}

    <div class="btn-row">
      <button type="submit" class="btn primary">${d._isNew ? "Add " + noun : "Save changes"}</button>
      <button type="button" class="btn" data-act="closeSheet">Cancel</button>
    </div>
  </form>`, d._short ? "sheet-75" : "");
  refreshFormHints();
}

// Status picker. Sold is set with Mark as sold on the coin's page.
function statusFields(d) {
  if (d.status === "sold") return `<div class="hint">Status: <b>Sold</b>. To change it, use Edit sale or Move back to collection on the coin's page.</div>`;
  const inh = isInherited(d);
  if (inh && d._status === "forsale") d._status = "owned";
  const opts = ["owned", "coming", "forsale", "gone"].filter((k) => !(k === "forsale" && inh));
  return `<div class="grid2">
      <label class="f"><span>Status</span><select data-f="_status" data-rerender>${opts.map((k) => `<option value="${k}" ${d._status === k ? "selected" : ""}>${STATUS_TEXT[k]}</option>`).join("")}</select></label>
      <label class="switch" style="align-self:end"><span>Upgrade wanted<div class="small muted">You'd like a nicer one</div></span><input type="checkbox" data-fcheck="upgrade" ${d.upgrade ? "checked" : ""}></label>
    </div>
    <label class="f"><span>Group <span class="muted small">(optional)</span></span><input type="text" data-f="group" list="groupList" value="${esc(d.group || "")}" placeholder="${esc(isInherited(d) ? "Inherited" : "My collection")}"><datalist id="groupList">${[...new Set(["My collection", "Inherited", ...allCoins().map((c) => String(c.group || "").trim()).filter(Boolean)])].map((g) => `<option value="${esc(g)}">`).join("")}</datalist></label>
    <div class="hint">${d._status === "coming" ? "Bought or won, not here yet. Counted in your totals." : d._status === "gone" ? "Traded, gifted or lost. Left out of your totals." : inh ? "Inherited coins can't be set to For sale." : ""}</div>
    ${d._status === "coming" || d.trackNo ? `<div class="grid2">
      <label class="f"><span>Tracking number</span><input type="text" data-f="trackNo" id="trackNo" value="${esc(d.trackNo || "")}" placeholder="Paste it here" maxlength="40" autocapitalize="characters"></label>
      <label class="f"><span>Carrier</span><select data-f="trackCarrier"><option value="">Work it out</option>${CARRIERS.map((x) => `<option ${d.trackCarrier === x ? "selected" : ""}>${x}</option>`).join("")}</select></label></div>
      <button type="button" class="link-btn" data-act="pasteTrack">📋 Paste tracking number</button>` : ""}
    ${d._status === "gone" ? `<div class="grid2">
      <label class="f"><span>What happened?</span><select data-f="_goneReason"><option value="">Choose…</option>${GONE_REASONS.map((x) => `<option ${d._goneReason === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
      <label class="f"><span>When</span><input type="date" data-f="_goneDate" value="${esc(d._goneDate || "")}" max="${today()}"></label></div>` : ""}`;
}
function purchaseFields(d) {
  const has = d.seller || d.paid || d.acquired || BUY_EXTRAS.some((k) => num(d[k]) != null) || d.payMethod || d.receiptNo || (d.receiptPhotos || []).length || (d.source && !d._isNew);
  const money$ = (k, label) => `<label class="f"><span>${label}</span><input type="number" inputmode="decimal" step="0.01" min="0" data-f="${k}" value="${esc(d[k] || "")}" placeholder="$"></label>`;
  return sec("purchase", "Purchase details" + (d.source ? ` <span class="muted small">· ${esc(d.source)}</span>` : ""), `<div class="grid2">
      <label class="f"><span>Paid each</span><input type="number" inputmode="decimal" step="0.01" data-f="paid" value="${esc(d.paid)}" placeholder="$"></label>
      <label class="f"><span>Date acquired</span><input type="date" data-f="acquired" value="${esc(d.acquired)}"></label>
    </div>
    <label class="f"><span>Source</span><select data-f="_sourceKind" data-rerender><option value="">Choose…</option>${sourceOptions().map((s) => `<option value="${esc(s)}" ${d._sourceKind === s ? "selected" : ""}>${esc(s)}</option>`).join("")}<option value="Other" ${d._sourceKind === "Other" ? "selected" : ""}>Other…</option></select></label>
    ${d._sourceKind === "Coin Shop" ? `<label class="f"><span>Shop or dealer name (optional)</span><input type="text" data-f="seller" list="sellerList" value="${esc(d.seller || "")}" placeholder="e.g. Main Street Coins" maxlength="60"></label>` : ""}
    ${d._sourceKind === "Other" ? `<label class="f"><span>Where did you get it?</span><input type="text" data-f="source" value="${esc(d.source)}" placeholder="e.g. Grandpa's collection, flea market"></label>` : ""}
    <div class="hint" id="inhHint" ${isInherited(d) ? "" : "hidden"}><span class="dns">Do not sell</span> Inherited coins are marked do-not-sell and aren't counted in gains.</div>
      <div class="grid2">
        ${d._sourceKind === "Coin Shop" ? "" : `<label class="f"><span>Seller</span><input type="text" data-f="seller" list="sellerList" value="${esc(d.seller || "")}" placeholder="Person or shop" maxlength="60"></label>`}
        <label class="f"><span>Paid with</span><select data-f="payMethod"><option value="">Choose…</option>${PAY_METHODS.concat(d.payMethod && !PAY_METHODS.includes(d.payMethod) ? [d.payMethod] : []).map((x) => `<option ${d.payMethod === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></label>
      </div>
      <datalist id="sellerList">${pastSellers().map((x) => `<option value="${esc(x)}">`).join("")}</datalist>
      <div class="grid3">${money$("buyTax", "Tax")}${money$("buyShip", "Shipping")}${money$("buyFees", "Fees")}</div>
      <div class="hint" id="costHint">${costHintText(d)}</div>
      <label class="f"><span>Receipt number</span><input type="text" data-f="receiptNo" value="${esc(d.receiptNo || "")}" placeholder="Order or invoice number" maxlength="60"></label>
      <div class="photos">${(d.receiptPhotos || []).map((p, i) => `<div class="ph"><img src="${esc(photoSrc(p))}" alt=""><button type="button" class="rm" data-act="rmPhoto" data-k="receiptPhotos" data-i="${i}" aria-label="Remove receipt photo">✕</button></div>`).join("")}</div>
      <label class="btn file-btn" style="display:inline-block;margin-top:6px">${(d.receiptPhotos || []).length ? "Add another receipt photo" : "Add receipt photo"}<input type="file" accept="image/*" id="receiptInput"></label>`, has);
}
function costHintText(d) {
  const c = costOf(d);
  if (c == null) return BUY_EXTRAS.some((k) => num(d[k]) != null) ? "Enter Paid each to see the total cost." : "Tax, shipping and fees are for this whole entry.";
  return "Total cost: " + money(c) + (qtyOf(d) > 1 ? " for " + qtyOf(d) + " coins" : "") + ". Used for your gains.";
}
function knownVarHint(d) {
  const kv = knownVarieties(d);
  return kv.length ? "Known for this date: " + kv.join(", ") + "." : d.typeId && d.year ? "No known varieties listed for this date. You can type one." : "Pick the type and year to see known varieties.";
}
function errorFields(d) {
  const errs = listOf(d.mintErrors), probs = listOf(d.problems);
  const checks = (key, all, on) => `<div class="chk-list">${all.map((x) => `<label><input type="checkbox" data-flist="${key}" value="${esc(x)}" ${on.includes(x) ? "checked" : ""}>${esc(x)}</label>`).join("")}</div>`;
  return sec("errors", "Errors and problems" + (probs.length ? " · Details" : ""), `
      <label class="f"><span>Known variety</span><input type="text" data-f="knownVar" list="kvList" value="${esc(d.knownVar || "")}" placeholder="e.g. Doubled Die Obverse" maxlength="60"></label>
      <datalist id="kvList">${knownVarieties(d).map((x) => `<option value="${esc(x)}">`).join("")}</datalist>
      <div class="hint" id="kvHint">${esc(knownVarHint(d))}</div>
      <div class="small" style="margin-top:8px"><b>Mint errors</b> <span class="muted">(mistakes made when it was struck)</span></div>
      ${checks("mintErrors", MINT_ERRORS, errs)}
      <div class="small"><b>Problems</b> <span class="muted">(damage after it left the Mint)</span></div>
      ${checks("problems", COIN_PROBLEMS, probs)}
      <div class="hint">Any problem makes it a "Details" coin. Red Book prices are for coins without problems, so they aren't used for it.</div>
      <label class="f"><span>Describe (optional)</span><textarea data-f="errorNote" placeholder="e.g. 10% off-center at 3 o'clock">${esc(d.errorNote || "")}</textarea></label>`, d.knownVar || errs.length || probs.length || d.errorNote);
}
// The holder the form shows: what was picked, else Album / Slab when that fits, else (new coins) the last holder used.
function formHolder(d) {
  if (itemOf(d) !== "coin") return d.holder || "";
  return d.holder || (d.albumId ? "Album" : d.gradeMode === "cert" ? "Slab" : d._isNew ? d._lastHolder || "" : "");
}
function holderFields(d) {
  const h = formHolder(d);
  const showPack = d.coa || h === "Mint box" || h === "Other";
  return `<div class="grid2">
      <label class="f"><span>${itemOf(d) === "set" ? "Packaging" : "Holder"}</span><select data-f="holder" data-rerender><option value="">Choose…</option>${holderList(d, h).map((x) => `<option ${h === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
      <label class="switch" style="align-self:end"><span>COA included<div class="small muted">Certificate of authenticity</div></span><input type="checkbox" data-fcheck="coa" data-rerender ${d.coa ? "checked" : ""}></label>
    </div>
    ${showPack ? `<label class="f"><span>${h === "Other" ? "Describe the holder / packaging" : "Box and packaging"}</span><input type="text" data-f="packaging" value="${esc(d.packaging || "")}" placeholder="${h === "Other" ? "e.g. velvet case" : "e.g. original blue box, outer sleeve"}"></label>` : ""}
    ${typeof boxFields === "function" ? boxFields(d) : ""}
    ${itemOf(d) === "coin" && isJunk(d) && d.metal === "Silver" ? `<label class="f"><span>Put in a stack <span class="muted small">(optional)</span></span><input type="text" data-f="stack" list="stackList" value="${esc(d.stack || "")}" placeholder="Not in a stack"><datalist id="stackList">${stackNames().map((x) => `<option value="${esc(x)}">`).join("")}</datalist></label>` : ""}
    ${itemOf(d) === "coin" && CASE_HOLDERS.includes(h) ? `<label class="f"><span>Case name <span class="muted small">(several coins in one case)</span></span><input type="text" data-f="caseName" list="caseNames" value="${esc(d.caseName || "")}" placeholder="e.g. Steel cents case"><datalist id="caseNames">${[...new Set(ownedCoins().map((c) => (c.caseName || "").trim()).filter(Boolean))].map((x) => `<option value="${esc(x)}">`).join("")}</datalist></label>` : ""}`;
}
function holderList(d, h) {
  const l = itemOf(d) === "set" ? SET_HOLDERS : itemOf(d) === "roll" ? ROLL_HOLDERS : itemOf(d) === "bullion" ? BULLION_HOLDERS : HOLDERS;
  return l.concat(h && !l.includes(h) ? [h] : []);
}
// Sets: kind and year. Rolls: count, condition and bank wrap.
function rollHint(d) {
  const f = rollFace(d);
  return (f != null ? "Face value " + money(f) + ". " : "") + "Leave the year empty for mixed dates.";
}
function rollFields(d) {
  return `<div class="grid2">
      <label class="f"><span>Coins in the roll</span><input type="number" inputmode="numeric" min="1" data-f="rollCount" value="${esc(d.rollCount)}"></label>
      <label class="f"><span>Roll condition</span><select data-f="rollCond"><option value="">Choose…</option>${ROLL_CONDS.map((x) => `<option ${d.rollCond === x ? "selected" : ""}>${x}</option>`).join("")}</select></label></div>
    <label class="switch"><span>Original bank wrap<div class="small muted">Never opened</div></span><input type="checkbox" data-fcheck="bankWrap" ${d.bankWrap ? "checked" : ""}></label>
    <div class="hint" id="rollHint">${esc(rollHint(d))}</div>`;
}
function bullionHint(d) { return bullionOz(d) ? "Pure silver: " + bullionOz(d) + " oz (weight × purity)." : "Pure silver ounces = weight × purity. Weight is in troy ounces (a kilo bar is 32.15 oz)."; }
function bullionTopHtml(d) {
  const makers = [...new Set(allCoins().filter((c) => itemOf(c) === "bullion").map((c) => (c.bMaker || "").trim()).filter(Boolean))];
  return `<div class="grid2">
      <label class="f"><span>What is it?</span><select data-f="bShape">${BULLION_SHAPES.map((x) => `<option value="${x}" ${(d.bShape === "Shape" ? "Other" : d.bShape || "Bar") === x ? "selected" : ""}>${esc(shapeName(x))}</option>`).join("")}</select></label>
      <label class="f"><span>Maker</span><input type="text" data-f="bMaker" list="makerList" value="${esc(d.bMaker || "")}" placeholder="e.g. Engelhard" maxlength="40"><datalist id="makerList">${makers.map((x) => `<option value="${esc(x)}">`).join("")}</datalist></label></div>
    <div class="grid2">
      <label class="f"><span>Weight (oz)</span><input type="number" inputmode="decimal" step="0.001" min="0" data-f="bWeight" value="${esc(d.bWeight || "")}" placeholder="10"></label>
      <label class="f"><span>Purity</span><input type="number" inputmode="decimal" step="0.001" min="0" max="1" data-f="bPurity" value="${esc(d.bPurity || "")}" placeholder="0.999"></label></div>
    <div class="hint" id="bullionHint">${esc(bullionHint(d))}</div>
    <label class="f"><span>Serial number <span class="muted small">(optional)</span></span><input type="text" data-f="bSerial" value="${esc(d.bSerial || "")}" maxlength="40"></label>
    <label class="f"><span>Stack</span><input type="text" data-f="stack" list="stackList" value="${esc(d.stack || "")}" placeholder="My Silver Stack"><datalist id="stackList">${stackNames().map((x) => `<option value="${esc(x)}">`).join("")}</datalist></label>
    <div class="hint">Silver only for now. It counts in your total and stays in the stack you name.</div>`;
}
function setTopHtml(d) {
  const k = SET_BY_ID[d.setKind];
  return (d._isNew ? `<label class="f"><span>Kind of set</span><select data-f="setKind" data-rerender><option value="">Choose…</option>${SET_KINDS.map((x) => `<option value="${x.id}" ${d.setKind === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>`
    : `<div class="f"><span>Kind of set</span><div class="locked-type"><b>${esc(k ? k.name : d.typeName || "Set")}</b></div></div>`)
    + `<label class="f"><span>Year</span><input type="number" inputmode="numeric" data-f="year" value="${esc(d.year)}" placeholder="1964"></label>
    <div class="hint" id="yearHint" style="color:var(--bad)">${esc(setYearProblem(d.setKind, d.year))}</div>`;
}
function setOzText(d) {
  if (!d.setKind || !d.year) return "";
  const v = setSilverOz(d.setKind, num(d.year));
  return v == null ? "Type the silver content from the box or a price guide, if it has silver." : v === 0 ? "This set has no silver coins." : "Filled in: " + v + " oz of silver in this set.";
}
// Coins outside the catalog: kinds, remembered items, and a grams-to-ounces helper.
const OTHER_KINDS = ["Commemorative", "Medal", "Token", "Foreign coin", "Other"];
const GRAMS_PER_TROY_OZ = 31.1035;
// Things typed before (name, face value, kind, metal, weight), newest first, so metal and weight are typed once.
function savedOthers() {
  const seen = new Map();
  allCoins().filter((c) => !c.typeId && c.typeName && itemOf(c) === "coin" && (c.status === "owned" || c.status === "sold")).forEach((c) => {
    const k = [c.typeName, c.denom, c.metal, c.oz].join("|");
    if (!seen.has(k)) seen.set(k, { name: c.typeName, denom: c.denom || "", family: OTHER_KINDS.includes(c.family) ? c.family : "", metal: c.metal || "", oz: c.oz || "" });
  });
  return [...seen.values()];
}
function otherPicker(d) {
  if (!d._isNew) return "";
  const list = savedOthers();
  if (!list.length) return "";
  return `<label class="f"><span>Used before</span><select data-act-change="useOther"><option value="">Pick one you've added before…</option>${list.map((o, i) => `<option value="${i}">${esc(o.name)}${o.denom ? " · " + esc(o.denom) : ""}${o.metal ? " · " + esc(o.metal) : ""}${num(o.oz) ? " · " + esc(o.oz) + " oz" : ""}</option>`).join("")}</select></label>`;
}
function gramsHelper(d) {
  if (!MELT_OF_METAL[d.metal]) return "";
  return `<div class="grid2">
    <label class="f"><span>Weight in grams</span><input type="number" inputmode="decimal" step="0.001" data-f="_grams" value="${esc(d._grams || "")}" placeholder="e.g. 20"></label>
    <label class="f"><span>Purity</span><input type="number" inputmode="decimal" step="0.001" data-f="_purity" value="${esc(d._purity || "")}" placeholder="0.900"></label></div>
  <div class="hint">Only know grams? Enter the weight and purity (0.900 = 90%) and the ounces fill in above.</div>`;
}
function gramsToOz(d) {
  const g = num(d._grams), p = num(d._purity);
  if (!g || !p || p <= 0 || p > 1) return;
  d.oz = String(Math.round((g * p / GRAMS_PER_TROY_OZ) * 100000) / 100000);
  const oi = $("[data-f=oz]"); if (oi) oi.value = d.oz;
}
function meltHintText(d) {
  const m = meltEach(d);
  const t = m != null ? "Melt today: " + money(m) + eachWord(d) + "." : meltKey(d) ? "Enter the spot price in Options to see melt." : "";
  return itemOf(d) === "set" ? (setOzText(d) + " " + t).trim() : t;
}
// Sets: fill in the silver for the kind and year, unless it was typed by hand.
function autoSetOz(d) {
  if (itemOf(d) !== "set" || d._ozEdited) return;
  const v = setSilverOz(d.setKind, num(d.year));
  d.oz = v ? String(v) : "";
  d.metal = num(d.oz) ? "Silver" : "";
}
function smsField(d) {
  if (!hasSms(d) || isProofGrade(d.grade)) return "";
  return `<label class="switch"><span>Special Mint Set (SMS)<div class="small muted">From a 1964–1967 Special Mint Set, not a regular strike.</div></span><input type="checkbox" data-fcheck="sms" ${d.sms ? "checked" : ""}></label>`;
}
function varietyField(d) {
  const vs = bookVarieties(d);
  if (!vs.some((v) => v)) return "";
  // Always offer a neutral first choice, so nothing gets tagged with a variety by accident.
  const choices = vs.includes("") ? vs : ["", ...vs];
  const blank = vs.includes("") ? "Regular (no variety)" : "Not sure / not listed";
  const tt = TYPE_BY_ID[d.typeId];
  const needsDesign = tt && tt.varieties && tt.varieties[d.year + "|" + normMint(d.mint)] && !d.variety;
  return `<label class="f"><span>Variety</span><select data-f="variety" data-rerender>${choices.map((v) => `<option value="${esc(v)}" ${(d.variety || "") === v ? "selected" : ""}>${esc(v || blank)}</option>`).join("")}</select></label>${needsDesign ? `<div class="hint">Pick the design so this coin fills its own spot in an album.</div>` : ""}`;
}
function bookHintText(d) {
  if (itemOf(d) === "bullion") return "Leave value empty to use melt. For a collectible bar, type your own value.";
  if (itemOf(d) === "set") return "Value is your own price. Leave it empty to use the silver (melt) value.";
  if (itemOf(d) === "roll") return "Leave value empty: clad rolls count at face value, silver rolls at melt. For a nicer roll (UNC, BU, bank wrap, key dates), type your own value. Check eBay sold on the roll's page helps.";
  if (isJunk(d)) return "";
  const b = bookLookup(d);
  if (!b) return "";
  const t = bookText(b);
  if (b.price != null && hasProblems(d)) return t + ". That price is for a coin without problems, so it isn't used for this one. Enter your own value (Check eBay sold helps)" + (meltEach(d) != null ? ", or melt is used." : ".");
  return b.price != null ? t + (num(d.value) == null ? ". Used as the value while Value each is empty." : "") : t;
}
// Link to the coin type's own PCGS Photograde page; types without a saved code open the general page.
const photoGuideCode = (c) => (c.typeId ? pcgsCodeFor(c.typeId, c.year, c.variety) : "");
const photoGuideText = (c) => (c.typeName && c.typeId ? "PCGS Photo Guide: " + c.typeName : "Compare grades on PCGS Photograde");
const photoGuideUrl = (c) => { const k = photoGuideCode(c); return k ? "https://www.pcgs.com/photograde#/" + k + "/Grades" : "https://www.pcgs.com/photograde"; };
function refreshFormHints() {
  const pl = $("#pcgsLink"); if (pl) { pl.href = photoGuideUrl(draft); pl.textContent = photoGuideText(draft) + " ↗"; }
  const el = $("#ebayLink"); if (el) el.href = ebayUrl(draft);
  const yh = $("#yearHint"); if (yh) yh.textContent = itemOf(draft) === "set" ? setYearProblem(draft.setKind, draft.year) : yearProblem(draft.typeId, draft.year, "coin");
  const bh = $("#bullionHint"); if (bh) bh.textContent = bullionHint(draft);
  const rh = $("#rollHint"); if (rh) rh.textContent = rollHint(draft);
  const mh = $("#meltHint"); if (mh) mh.textContent = meltHintText(draft);
  const ch = $("#costHint"); if (ch) ch.textContent = costHintText(draft);
  const kh = $("#kvHint"); if (kh) kh.textContent = knownVarHint(draft);
  const kl = $("#kvList"); if (kl) { const h = knownVarieties(draft).map((x) => `<option value="${esc(x)}">`).join(""); if (kl.innerHTML !== h) kl.innerHTML = h; }
  const sb = $("#smsBox");
  if (sb) {
    if (!hasSms(draft) || isProofGrade(draft.grade)) draft.sms = false;
    const html = smsField(draft);
    if (sb.innerHTML.trim() !== html.trim() && !(html && sb.querySelector("input"))) sb.innerHTML = html;
    if (!html) sb.innerHTML = "";
  }
  const vb = $("#varietyBox");
  if (vb) {
    const vs = bookVarieties(draft);
    if (!vs.includes(draft.variety || "")) draft.variety = ""; // never auto-pick a variety
    const html = varietyField(draft);
    if (vb.innerHTML !== html) vb.innerHTML = html;
  }
  const h = $("#bookHint");
  if (h) h.textContent = bookHintText(draft);
  const vi = $("[data-f=value]");
  if (vi && !isJunk(draft)) { const bp = hasProblems(draft) ? null : bookPrice(draft); vi.placeholder = bp != null ? bp.toFixed(2) : "$"; }
}

// Albums a coin can go in: only albums for its coin type (plus the one it's already in).
function albumsForCoin(d) {
  return albums().filter((a) => a.id === d.albumId || (d.typeId ? albumHasType(a, d.typeId) : d._isNew || !albumTypes(a).length));
}
function pickType(id) {
  if (draft && !draft._isNew) return; // a saved coin's type never changes
  const t = TYPE_BY_ID[id];
  draft.fbl = false;
  if (!t) return;
  draft.typeId = t.id;
  draft.typeName = shortName(t);
  draft.family = t.family;
  draft.denom = t.denom;
  draft.metal = t.metal;
  draft.oz = t.oz || "";
  if (draft.mint && !t.mints.includes(draft.mint) && draft.mint !== "") draft.mint = "";
  const al = draft.albumId && getAlbum(draft.albumId);
  if (al && !albumHasType(al, t.id)) { draft.albumId = ""; delete draft.slotId; } // that album is for other types
  applyYearMetal(draft);
  if (itemOf(draft) === "roll" && !draft._countEdited) draft.rollCount = ROLL_COUNTS[t.denom] || "";
  renderCoinForm();
}

// The fields that make up a coin's type. Locked once the coin is saved.
const TYPE_FIELDS = ["typeId", "typeName", "family", "denom", "item", "setKind"];
// "Wrong type? Re-add it": a new coin with everything copied except the type, replacing the old one on save.
function retypeDraft() {
  if (!draft || draft._isNew) return;
  const old = getCoin(draft.id);
  if (!old) return;
  const keep = JSON.parse(JSON.stringify(draft));
  draft = { ...keep, id: uid(), _isNew: true, _what: "us", _replaces: old.id, typeId: "", typeName: "", family: "", denom: "", metal: "", oz: "",
    variety: "", fbl: false, sms: false, label: "", labelEdited: false, albumId: "", createdAt: Date.now(), _newAlbum: { brand: "Whitman", number: "" } };
  delete draft.slotId; delete draft.lotId; delete draft.splitFrom;
  renderCoinForm();
  toast("Pick the right coin type, then tap Add coin. Everything else was copied.");
}

/* --- recently used coin types (kept in settings, newest first, max 5) --- */
const recentTypeIds = () => (settings().recentTypes || []).filter((id) => TYPE_BY_ID[id]).slice(0, 5);
function touchType(id) {
  if (!TYPE_BY_ID[id]) return;
  const cur = recentTypeIds();
  const next = [id, ...cur.filter((x) => x !== id)].slice(0, 5);
  if (next.join() !== cur.join()) saveSettings({ recentTypes: next });
}
// Recent types first, then everything else, in the same order as before.
function typesRecentFirst(list) {
  const rec = recentTypeIds();
  const recSet = new Set(rec);
  return { recent: rec.map((id) => TYPE_BY_ID[id]).filter((t) => list.includes(t)), rest: list.filter((t) => !recSet.has(t.id)) };
}
function typeMatches(q) {
  q = q.trim().toLowerCase();
  const words = q ? q.split(/\s+/) : [];
  const all = COIN_TYPES.filter((t) => words.every((w) => (t.name + " " + t.family + " " + t.denom).toLowerCase().includes(w)));
  const { recent, rest } = typesRecentFirst(all);
  return { recent, rest: rest.slice(0, q ? 20 : 12) };
}
function showTypeList(q) {
  const box = $("#typeList");
  if (!box) return;
  const { recent, rest } = typeMatches(q);
  const btn = (t) => `<button type="button" data-act="pickType" data-id="${t.id}">${esc(t.name)}<small>${esc(t.denom)} · ${t.start}–${t.end} · ${esc(t.metal)}</small></button>`;
  const head = (txt) => `<div class="ta-head">${txt}</div>`;
  box.innerHTML = recent.length || rest.length
    ? (recent.length ? head("Recent") + recent.map(btn).join("") + (rest.length ? head("All types") : "") : "") + rest.map(btn).join("")
    : `<div class="hint" style="padding:10px">No match. Type the coin type below instead.</div>`;
  box.hidden = false;
}

async function saveDraft() {
  const d = draft;
  const c = { ...d };
  delete c._isNew; delete c._newAlbum; delete c._fillBlobs; delete c._fromWant; delete c._stay; delete c._short; delete c._what; delete c._open; delete c._sourceKind; delete c._replaces; delete c._proof; delete c._preProof; // working copies aren't saved
  delete c._grams; delete c._purity; delete c._lastHolder; delete c._status; delete c._goneReason; delete c._goneDate;
  c.holder = formHolder(d);
  if (typeof boxCheck === "function") { const m = boxCheck(c); if (m) { toast(m); return; } }
  if (c.gradeMode !== "cert") { c.cac = ""; c.catNo = ""; }
  // Status: Sold (and deleted) are only changed from the coin's page.
  if (c.status === "owned" || c.status === "gone") {
    const k = d._status || "owned";
    if (k === "forsale" && isInherited(c)) { toast("Inherited coins can't be set to For sale."); return; }
    if (k === "gone") { c.status = "gone"; c.stage = ""; c.gone = { reason: d._goneReason || "", date: d._goneDate || "" }; }
    else { c.status = "owned"; c.stage = k === "owned" ? "" : k; delete c.gone; }
  }
  c.upgrade = !!c.upgrade;
  c.mintErrors = listOf(c.mintErrors); c.problems = listOf(c.problems);
  c.trackNo = String(c.trackNo || "").replace(/\s+/g, "");
  ["seller", "knownVar", "receiptNo", "catNo", "trackCarrier"].forEach((k) => { c[k] = String(c[k] || "").trim(); });
  BUY_EXTRAS.forEach((k) => { c[k] = num(c[k]) == null ? "" : String(Math.max(0, num(c[k]))); });
  const prev = !d._isNew && getCoin(c.id);
  if (prev) TYPE_FIELDS.forEach((k) => { c[k] = prev[k]; }); // a saved coin's type never changes, whatever the form says
  const al0 = c.albumId && c.albumId !== "__new" && getAlbum(c.albumId);
  if (al0 && albumTypes(al0).length && !albumHasType(al0, c.typeId) && !(prev && prev.albumId === c.albumId)) { toast("That album is for a different coin type."); return; }
  c.year = num(c.year) ?? "";
  c.qty = Math.max(1, num(c.qty) || 1);
  delete c._ozEdited; delete c._countEdited;
  const it = itemOf(c);
  if (it === "coin") { delete c.item; delete c.setKind; delete c.rollCount; delete c.rollCond; delete c.bankWrap; }
  if (it !== "coin" || !CASE_HOLDERS.includes(c.holder)) delete c.caseName; else if (c.caseName) c.caseName = c.caseName.trim();
  if (it !== "bullion") { delete c.bShape; delete c.bMaker; delete c.bSerial; delete c.bWeight; delete c.bPurity; }
  if (it === "bullion") {
    const w = num(c.bWeight), p = num(c.bPurity);
    if (!w || w <= 0) { toast("Enter the weight in ounces."); return; }
    if (!p || p <= 0 || p > 1) { toast("Purity is a number up to 1, like 0.999."); return; }
    if (c.bShape === "Shape") c.bShape = "Other";
    if (!BULLION_SHAPES.includes(c.bShape)) c.bShape = "Bar";
    c.bWeight = String(w); c.bPurity = String(p); c.bMaker = String(c.bMaker || "").trim(); c.bSerial = String(c.bSerial || "").trim();
    Object.assign(c, { typeId: "", denom: "", mint: "", year: "", gradeMode: "raw", grade: "", cac: "", albumId: "", metal: "Silver", family: "Bullion", typeName: "Bullion" });
    c.oz = String(bullionOz(c)); delete c.slotId; delete c.rollCount; delete c.rollCond; delete c.bankWrap; delete c.setKind;
  }
  const stackable = it === "bullion" || (it === "coin" && isJunk(c) && c.metal === "Silver");
  const stk = String(c.stack || "").trim();
  if (!stackable || (!stk && it !== "bullion")) delete c.stack; else c.stack = stk || "My Silver Stack";
  if (it === "set") {
    const k = SET_BY_ID[c.setKind];
    if (!k && d._isNew) { toast("Pick the kind of set."); return; }
    if (k && d._isNew) { c.typeName = k.name; c.family = "Sets"; }
    Object.assign(c, { typeId: "", denom: "", mint: "", gradeMode: "raw", grade: "", cac: "", albumId: "" }); delete c.slotId;
    c.metal = num(c.oz) ? "Silver" : "";
    delete c.rollCount; delete c.rollCond; delete c.bankWrap;
  } else if (it === "roll") {
    c.rollCount = rollCountOf(c);
    if (!ROLL_CONDS.includes(c.rollCond)) c.rollCond = "";
    c.bankWrap = !!c.bankWrap;
    Object.assign(c, { gradeMode: "raw", grade: "", cac: "", albumId: "" }); delete c.slotId; delete c.setKind;
    if (!c.typeId && !c.typeName) { toast("Pick the coin type for the roll."); return; }
  }
  if (!c.typeName && !c.year && !c.label) { toast("Add at least a year or a coin type."); return; }
  // Coins saved before this check keep their year; only a new or changed year is checked.
  const yp = it === "set" ? setYearProblem(c.setKind, c.year) : yearProblem(c.typeId, c.year, "coin");
  if (yp && !(prev && String(prev.year) === String(c.year))) { toast(yp); return; }
  if (!c.family) c.family = c.typeName || "Other";
  if (!c.labelEdited) c.label = autoLabel(c);
  if (c.slotId) {
    const sl = getAlbum(c.albumId) && (getAlbum(c.albumId).slots || []).find((x) => x.id === c.slotId);
    const al = getAlbum(c.albumId);
    if (sl && sl.pf && d._isNew && !isProofGrade(c.grade)) { toast("This is a proof spot. Pick a proof grade (PR-60 to PR-70)."); return; }
    if (sl && !sl.pf && !sl.set && d._isNew && al.proofs && isProofGrade(c.grade)) { toast("This spot is for a regular coin. Use the album's Proof spot for a proof."); return; }
    // The spot is gone, or the coin no longer fits it (date, mint, type, or proof vs. regular), so it finds its right spot.
    const fitsSpot = sl && (sl.set ? c.typeId === sl.t : num(c.year) === sl.y && normMint(c.mint) === sl.m && (!sl.pf === !isProofGrade(c.grade) || !(sl.pf || al.proofs)));
    if (!fitsSpot) delete c.slotId;
  }
  if (c.albumId === "__new") {
    const na = d._newAlbum;
    const t = TYPE_BY_ID[c.typeId];
    const info = typeof lookupAlbum === "function" ? lookupAlbum(na.brand, na.number) : null;
    const numClean = info ? info.number : na.number.trim();
    const match = albums().find((a) => a.brand === na.brand && (a.number || "") === numClean && albumHasType(a, c.typeId));
    if (match) c.albumId = match.id;
    else if (info && info.types.includes(c.typeId)) {
      const pf = lookupProofs(info);
      const a = { kind: "album", id: uid(), brand: na.brand, number: info.number, name: info.name, typeId: info.types[0], typeIds: info.types, layout: "dates", start: info.start, end: info.end, proofs: pf, removed: [], createdAt: Date.now() };
      a.slots = buildAlbumSlots(info.types, "dates", info.start, info.end, pf);
      put("a_" + a.id, a);
      c.albumId = a.id;
    } else {
      const a = { kind: "album", id: uid(), brand: na.brand, number: na.number.trim(), name: na.brand === "Other" ? na.number.trim() : "", typeId: c.typeId,
        start: t ? t.start : num(c.year) || 1900, end: t ? t.end : num(c.year) || 1900, removed: [], createdAt: Date.now() };
      a.slots = t ? buildSlots(t.id, a.start, a.end) : [{ y: num(c.year), m: normMint(c.mint) }];
      put("a_" + a.id, a);
      c.albumId = a.id;
    }
  }
  const isNew = d._isNew;
  if (isNew) { // quick-add remembers these for the next coin (Album and Slab fill in on their own)
    const keep = ["Album", "Slab"].includes(c.holder) || it !== "coin" ? settings().lastHolder || "" : c.holder;
    const s0 = settings();
    if ((s0.lastSource || "") !== (c.source || "") || (s0.lastHolder || "") !== keep) saveSettings({ lastSource: c.source || "", lastHolder: keep });
  }
  if (d._fromWant) remove("w_" + d._fromWant); // bought a coin off the want list
  if (c.typeId) touchType(c.typeId);
  closeSheet();
  await saveCoin(c);
  if (d._replaces) {
    const old = getCoin(d._replaces);
    if (old) {
      const before = JSON.parse(JSON.stringify(old));
      await saveCoin({ ...old, prevStatus: old.status, status: "deleted", deletedAt: Date.now() });
      toast("Re-added as " + labelOf(c) + ". The old entry is in Recently deleted.", { label: "Undo", fn: () => { remove("c_" + c.id); saveCoin(before); go("coin-" + before.id); } });
      go("coin-" + c.id);
      return;
    }
  }
  if (isNew && d._stay) { toast("Added to " + (getAlbum(c.albumId) ? albumTitle(getAlbum(c.albumId)) : "the album") + "."); return; } // stay on the album
  toast(isNew ? "Coin added." : "Saved.");
  if (isNew) go("coin-" + c.id);
}

// Resize to at most 1600px and save as JPEG (also converts iPhone HEIC photos the browser can show).
async function decodeImage(file) {
  try { return await createImageBitmap(file); } catch (e) { /* fall back to an <img> below */ }
  return await new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { res(img); setTimeout(() => URL.revokeObjectURL(url), 1000); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("decode")); };
    img.src = url;
  });
}
async function shrinkImage(file) {
  try {
    const bmp = await decodeImage(file);
    const w = bmp.width || bmp.naturalWidth, h = bmp.height || bmp.naturalHeight;
    const max = 1600;
    const scale = Math.min(1, max / Math.max(w, h));
    const cv = document.createElement("canvas");
    cv.width = Math.round(w * scale);
    cv.height = Math.round(h * scale);
    cv.getContext("2d").drawImage(bmp, 0, 0, cv.width, cv.height);
    return await new Promise((res) => cv.toBlob((b) => res(b || file), "image/jpeg", 0.85));
  } catch (e) { return file; }
}
// target: "photos" (the coin) or "receiptPhotos".
async function addPhotos(files, target = "photos") {
  const hint = $(target === "photos" ? "#photoHint" : "#costHint");
  const into = (ref) => { if (!draft) return; if (!Array.isArray(draft[target])) draft[target] = []; draft[target].push(ref); };
  for (const f of files) {
    if (hint) hint.textContent = "Uploading photo…";
    const blob = await shrinkImage(f);
    if (store.mode === "local") {
      try { const lid = await localAddPhoto(blob); into({ lid }); }
      catch (e) { toast(e && e.name === "QuotaExceededError" ? "This device is out of space for photos." : "Couldn't save that photo."); }
    } else if (store.mode === "db") {
      if (!assetsApi) { toast("Photos can't be saved from this view."); break; }
      try {
        const a = await assetsApi.upload(blob);
        into({ id: a.id });
      } catch (e) { toast("Couldn't upload that photo."); }
    } else if (draft) {
      into({ url: URL.createObjectURL(blob) });
    }
  }
  if (draft) renderCoinForm();
}

/* --- Where a coin was sold --- */
const SOLD_WHERE = ["Whatnot", "eBay", "eBay Live", "Coin show", "Other"];
// Older sales saved "where" as free text; read it back as one of the choices when it matches.
function whereParts(sold) {
  if (!sold) return { type: "", detail: "" };
  if (sold.whereType) return { type: sold.whereType, detail: sold.whereDetail || "" };
  const w = String(sold.where || "").trim();
  if (!w) return { type: "", detail: "" };
  const hit = SOLD_WHERE.find((o) => o !== "Other" && o.toLowerCase() === w.toLowerCase());
  return hit ? { type: hit, detail: "" } : { type: "Other", detail: w };
}
function whereText(sold) {
  const { type, detail } = whereParts(sold);
  if (type === "Coin show") return detail ? "Coin show: " + detail : "Coin show";
  if (type === "Other") return detail || "Other";
  return type;
}
function whereDetailField(type, detail) {
  if (type === "Coin show") return `<label class="f"><span>Which coin show?</span><input type="text" name="whereDetail" placeholder="e.g. FUN Show, Baltimore Expo" value="${esc(detail)}"></label>`;
  if (type === "Other") return `<label class="f"><span>Where was it sold?</span><input type="text" name="whereDetail" placeholder="e.g. local coin shop, Facebook" value="${esc(detail)}"></label>`;
  return "";
}
function whereFields(sv) {
  const { type, detail } = whereParts(sv);
  return `<label class="f"><span>Where (optional)</span><select name="whereType" id="whereType"><option value="">Choose…</option>${SOLD_WHERE.map((o) => `<option ${type === o ? "selected" : ""}>${o}</option>`).join("")}</select></label>
    <div id="whereDetailBox">${whereDetailField(type, detail)}</div>`;
}
function readWhere(fd) {
  const type = String(fd.get("whereType") || "");
  const detail = type === "Coin show" || type === "Other" ? String(fd.get("whereDetail") || "").trim() : "";
  const sold = { whereType: type, whereDetail: detail };
  sold.where = whereText(sold); // plain text too, for exports and older screens
  return sold;
}
document.addEventListener("change", (e) => {
  if (e.target.id !== "whereType") return;
  const box = $("#whereDetailBox");
  const keep = box && box.querySelector("input") ? box.querySelector("input").value : "";
  if (box) box.innerHTML = whereDetailField(e.target.value, keep);
  const inp = box && box.querySelector("input");
  if (inp) inp.focus();
});

/* --- Sell --- */
function openSell(id, edit) {
  const c = getCoin(id);
  if (!c) return;
  const q = edit ? 1 : qtyOf(c); // editing a sale never splits the coin
  const sv = (edit && c.sold) || {};
  const val = (v) => (v == null ? "" : esc(v));
  openSheet(`<div class="sheet-head"><h2>${edit ? "Edit sale" : "Mark as sold"}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
  <p><b>${esc(labelOf(c))}</b></p>
  ${isInherited(c) ? `<div class="banner" style="margin:0 0 8px"><span class="dns">Do not sell</span> This coin is inherited. It won't be counted in sold results.</div>` : ""}
  <form id="sellForm" data-id="${esc(c.id)}" ${edit ? 'data-edit="1"' : ""}>
    ${q > 1 ? `<label class="f"><span>How many sold (of ${q})</span><input type="number" name="n" min="1" max="${q}" value="${q}"></label>` : ""}
    <label class="f"><span>Date sold</span><input type="date" name="date" value="${edit ? val(sv.date) : today()}"></label>
    <label class="f"><span>Sold for (total, optional)</span><input type="number" inputmode="decimal" step="0.01" name="amount" placeholder="$" value="${val(sv.amount)}"></label>
    <div class="grid2">
      <label class="f"><span>Shipping (optional)</span><input type="number" inputmode="decimal" step="0.01" name="shipping" placeholder="$" value="${val(sv.shipping)}"></label>
      <label class="f"><span>Insurance (optional)</span><input type="number" inputmode="decimal" step="0.01" name="insurance" placeholder="$" value="${val(sv.insurance)}"></label>
    </div>
    ${whereFields(sv)}
    <label class="f"><span>Sold to (optional)</span><input type="text" name="soldTo" placeholder="Buyer's name or username" value="${val(sv.to)}"></label>
    <div class="btn-row"><button class="btn primary" type="submit">${edit ? "Save sale" : "Mark sold"}</button><button class="btn" type="button" data-act="closeSheet">Cancel</button></div>
  </form>`);
}
function doSell(form) {
  const c = getCoin(form.dataset.id);
  if (!c) return;
  const fd = new FormData(form);
  const q = qtyOf(c);
  const n = Math.min(q, Math.max(1, num(fd.get("n")) || q));
  const sold = { at: Date.now(), date: fd.get("date") || today(), amount: num(fd.get("amount")), shipping: num(fd.get("shipping")), insurance: num(fd.get("insurance")), ...readWhere(fd), to: String(fd.get("soldTo") || "").trim() };
  if (form.dataset.edit) {
    // Only the sale details change; keep when it was first recorded so ordering stays the same.
    saveCoin({ ...c, sold: { ...sold, at: (c.sold && c.sold.at) || sold.at } });
    closeSheet();
    toast("Sale updated.");
    return;
  }
  if (n < q) {
    // Both pieces share a lot id, so moving them back always rejoins them, whichever piece survives.
    const lotId = c.lotId || c.id;
    const ex = splitExtras(c, n); // tax, shipping and fees shared by quantity
    saveCoin({ ...c, ...ex.keep, qty: q - n, lotId });
    saveCoin({ ...c, ...ex.part, id: uid(), qty: n, status: "sold", stage: "", sold, splitFrom: c.id, lotId });
  } else {
    saveCoin({ ...c, status: "sold", stage: "", sold });
  }
  const s = settings();
  if (!s.soldAutoDone) saveSettings({ showSold: true, soldAutoDone: true });
  closeSheet();
  toast("Marked as sold.");
  go("coins");
}

/* --- New album --- */
function openNewAlbum() {
  openSheet(`<div class="sheet-head"><h2>New album</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
  <form id="albumForm">
    <div class="grid2">
      <label class="f"><span>Brand</span><select name="brand">${ALBUM_BRANDS.map((b) => `<option>${b}</option>`).join("")}</select></label>
      <label class="f"><span>Album number</span><input type="text" name="number" placeholder="9128"></label>
    </div>
    <div class="hint" id="albumLookupHint"></div>
    <label class="f"><span>Name (optional)</span><input type="text" name="name" placeholder="Grandpa's Morgans"></label>
    <label class="f"><span>Kind of album</span><select name="layout" id="albumLayout">
      <option value="dates">Dates and mint marks (most albums)</option><option value="set">Type set (one coin of each type)</option></select></label>
    ${albumTypeRows([firstAlbumType().id])}
    ${proofSelect("")}
    <div class="grid2">
      <label class="f"><span>From year</span><input type="number" name="start" id="albumStart" value="${firstAlbumType().start}"></label>
      <label class="f"><span>To year</span><input type="number" name="end" id="albumEnd" value="${typeLastYear(firstAlbumType())}"></label>
    </div>
    <div class="hint" id="albumHint">Use the years printed on your album. Each coin type gets spots for the dates and mint marks struck in those years. You can add, hide or reorder spots later.</div>
    <div class="btn-row"><button class="btn primary" type="submit">Create album</button><button class="btn" type="button" data-act="closeSheet">Cancel</button></div>
  </form>`);
}
// One coin-type picker per type in the album, with "+ Add another coin type".
function albumTypeRow(id, i) {
  return `<div class="type-row"><select name="typeId" data-albumtype>${typeOptions(id)}</select>${i ? `<button type="button" class="type-del" data-act="albumDelType" aria-label="Remove this type">✕</button>` : ""}</div>`;
}
function albumTypeRows(ids) {
  return `<div class="f"><span>Coin types in this album</span><div id="albumTypes">${ids.map(albumTypeRow).join("")}</div>
    <button type="button" class="link-btn" data-act="albumAddType">+ Add another coin type</button></div>`;
}
function proofSelect(cur) {
  cur = cur === true ? "all" : cur || "";
  const o = (v, l) => `<option value="${v}" ${cur === v ? "selected" : ""}>${l}</option>`;
  return `<label class="f"><span>Proof spots</span><select name="proofs">${o("", "None")}${o("s", "S proofs only (1968 on)")}${o("all", "All proofs")}</select></label>`;
}
function readAlbumTypes(form) { return [...new Set(new FormData(form).getAll("typeId").filter((id) => TYPE_BY_ID[id]))]; }
// Check the album's types and years. Returns a message, or "" when it's fine.
function albumProblem(types, layout, start, end) {
  if (!types.length) return "Pick at least one coin type.";
  if (layout === "set") return "";
  const off = types.find((id) => { const t = TYPE_BY_ID[id]; return t.start > end || typeLastYear(t) < start; });
  if (off) return TYPE_BY_ID[off].name + " wasn't made in " + start + "–" + end + ".";
  const lo = Math.min(...types.map((id) => TYPE_BY_ID[id].start)), hi = Math.max(...types.map((id) => typeLastYear(TYPE_BY_ID[id])));
  if (start < lo || end > hi) return "These coin types cover " + lo + "–" + hi + ".";
  return "";
}
function typeOptions(sel) {
  const { recent, rest } = typesRecentFirst(COIN_TYPES);
  const opt = (t) => `<option value="${t.id}" ${sel === t.id ? "selected" : ""}>${esc(t.name)} (${t.start}–${t.end})</option>`;
  return recent.length ? `<optgroup label="Recent">${recent.map(opt).join("")}</optgroup><optgroup label="All types">${rest.map(opt).join("")}</optgroup>` : rest.map(opt).join("");
}
const firstAlbumType = () => TYPE_BY_ID[recentTypeIds()[0]] || COIN_TYPES[0];
function doNewAlbum(form) {
  const fd = new FormData(form);
  const types = readAlbumTypes(form);
  const layout = fd.get("layout") === "set" ? "set" : "dates";
  const info0 = typeof lookupAlbum === "function" ? lookupAlbum(fd.get("brand"), fd.get("number")) : null;
  const t = TYPE_BY_ID[types[0]];
  let start = num(fd.get("start")) ?? (t ? t.start : 0), end = num(fd.get("end")) ?? (t ? t.end : 0);
  if (start > end) [start, end] = [end, start];
  const prob = albumProblem(types, layout, start, end);
  if (prob) { toast(prob); return; }
  const proofs = (layout !== "set" && fd.get("proofs")) || "";
  if (proofs && !hasProofs(types)) { toast("The app doesn't have proof dates for these coin types yet. Add proof spots with + Add a spot."); return; }
  const a = { kind: "album", id: uid(), brand: fd.get("brand"), number: info0 ? info0.number : (fd.get("number") || "").trim(), name: (fd.get("name") || "").trim(), typeId: types[0], typeIds: types, layout, start, end, proofs, removed: [], createdAt: Date.now() };
  a.slots = buildAlbumSlots(types, layout, start, end, proofs);
  put("a_" + a.id, a);
  types.forEach(touchType);
  closeSheet();
  go("album-" + a.id);
}
// "Part of a series" in Edit album: link this album with another, or unlink it.
function seriesField(a) {
  const cur = albumSeriesOf(a);
  const others = albums().filter((x) => x.id !== a.id);
  if (!others.length) return "";
  const withMe = cur ? others.filter((x) => albumSeriesOf(x) === cur) : [];
  return `<label class="f"><span>Part of a series</span><select name="series">
      <option value="" ${!cur ? "selected" : ""}>Not linked</option>
      ${others.map((x) => `<option value="${esc(x.id)}" ${withMe[0] === x ? "selected" : ""}>Keep with ${esc(albumTitle(x))}</option>`).join("")}
    </select></label>
    <div class="hint">Albums in a series (like Morgan Vol. 1, 2 and 3) stay together on the Albums page and move together.${cur && !a.seriesId ? " This one was linked automatically because the album numbers follow each other." : ""}</div>`;
}
// The seriesId to save for this album; may also link the album it was joined to.
function seriesFromForm(a, fd) {
  if (!fd.has("series")) return {};
  const pick = fd.get("series");
  const cur = albumSeriesOf(a);
  if (!pick) return cur ? { seriesId: "solo" } : (a.seriesId === "solo" ? { seriesId: "solo" } : {});
  const other = getAlbum(pick);
  if (!other) return {};
  const theirs = albumSeriesOf(other);
  if (theirs && theirs === cur) return {}; // already together
  let sid = other.seriesId && other.seriesId !== "solo" ? other.seriesId : "s" + uid();
  if (!other.seriesId || other.seriesId === "solo" || String(theirs || "").startsWith("auto:")) {
    // Make the other album's series (including automatic links) a saved one.
    const mates = theirs ? albums().filter((x) => albumSeriesOf(x) === theirs) : [other];
    mates.forEach((m) => { if (m.id !== a.id) put("a_" + m.id, { ...m, seriesId: sid }); });
  }
  return { seriesId: sid };
}
// Edit an album's details. Changing the date range keeps your own spots, hidden spots,
// order and spot names inside the range; it only adds or drops the standard dates.
function openEditAlbum(id) {
  const a = getAlbum(id);
  if (!a) return;
  openSheet(`<div class="sheet-head"><h2>Edit album</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
  <form id="editAlbumForm" data-id="${esc(a.id)}">
    <div class="grid2">
      <label class="f"><span>Brand</span><select name="brand">${ALBUM_BRANDS.map((b) => `<option ${a.brand === b ? "selected" : ""}>${b}</option>`).join("")}</select></label>
      <label class="f"><span>Album number</span><input type="text" name="number" value="${esc(a.number || "")}"></label>
    </div>
    <div class="hint" id="albumLookupHint"></div>
    <label class="f"><span>Name (optional)</span><input type="text" name="name" value="${esc(a.name || "")}"></label>
    ${seriesField(a)}
    <div class="small muted" style="margin-top:10px">${isSetAlbum(a) ? "Type set (one coin of each type)" : "Dates and mint marks"}</div>
    ${albumTypeRows(albumTypes(a).length ? albumTypes(a) : [COIN_TYPES[0].id])}
    ${isSetAlbum(a) ? "" : proofSelect(a.proofs)}
    <div class="grid2">
      <label class="f"><span>From year</span><input type="number" name="start" value="${a.start}"></label>
      <label class="f"><span>To year</span><input type="number" name="end" value="${a.end}"></label>
    </div>
    <div class="hint">Adding a coin type adds its spots. Changing the years or removing a type keeps the spots you added or hid; standard spots that no longer fit are dropped and come back if you add them again.</div>
    <div class="btn-row"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" data-act="closeSheet">Cancel</button></div>
  </form>`);
}
function saveEditAlbum(form) {
  const a = withSlotIds(getAlbum(form.dataset.id));
  if (!a) return;
  const fd = new FormData(form);
  let start = num(fd.get("start")) ?? a.start, end = num(fd.get("end")) ?? a.end;
  if (start > end) [start, end] = [end, start];
  const layout = isSetAlbum(a) ? "set" : "dates";
  const set = layout === "set";
  const oldTypes = albumTypes(a), types = readAlbumTypes(form);
  const oldPf = a.proofs === true ? "all" : a.proofs || "";
  const proofs = (!set && fd.get("proofs")) || "";
  if (proofs && !oldPf && !hasProofs(types)) { toast("The app doesn't have proof dates for these coin types yet. Add proof spots with + Add a spot."); return; }
  const unchanged = types.join() === oldTypes.join() && start === a.start && end === a.end && proofs === oldPf;
  // Years already allowed for an unchanged album, so older albums with odd ranges can still be renamed.
  const prob = unchanged ? "" : albumProblem(types, layout, start, end);
  if (prob) { toast(prob); return; }
  let slots = a.slots || [];
  if (!unchanged) {
    const fits = (x, ts, s0, e0, pf) => ts.includes(x.t) && (set || (x.y >= s0 && x.y <= e0)) && (!x.pf || pf === "all" || (pf === "s" && x.m === "S"));
    // Keep your own spots, and standard spots that still fit (with their ids, names and order).
    const kept = slots.map((x) => (x.t || x.custom ? x : { ...x, t: slotType(a, x) })).filter((x) => (x.custom && (!x.t || types.includes(x.t))) || fits(x, types, start, end, proofs));
    const have = new Set(kept.map(slotKey));
    // Add standard spots for new types and new years only (spots you removed before stay removed).
    const added = buildAlbumSlots(types, layout, start, end, proofs).filter((x) => !have.has(slotKey(x)) && !fits(x, oldTypes, a.start, a.end, oldPf));
    slots = set ? [...kept, ...added] : sortSlots([...kept, ...added]);
  }
  const removed = a.removed || [];
  put("a_" + a.id, { ...a, brand: fd.get("brand"), number: String(fd.get("number") || "").trim(), name: String(fd.get("name") || "").trim(), start, end, typeId: types[0] || a.typeId, typeIds: types, proofs, slots, removed, ...seriesFromForm(a, fd) });
  closeSheet();
  toast("Album saved.");
}

// New album: the years follow the coin types picked (earliest start to latest end).
function albumYearsFromTypes() {
  const f = $("#albumForm");
  if (!f || !$("#albumStart")) return;
  const ts = readAlbumTypes(f).map((id) => TYPE_BY_ID[id]);
  if (!ts.length) return;
  $("#albumStart").value = Math.min(...ts.map((t) => t.start));
  $("#albumEnd").value = Math.max(...ts.map(typeLastYear));
}

// Delegates to wants.js, which knows about want lists.
function openMissing(id) { openMissingPicker(id); }

/* CSV import and export live in sheets.js */

/* ---------- toast ---------- */
let toastTimer = null;
function toast(msg, action) {
  const t = $("#toast");
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button data-act="toastAction">${esc(action.label)}</button>` : ""}`;
  t.hidden = false;
  t._action = action ? action.fn : null;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, action ? 8000 : 2800);
}

/* ---------- events ---------- */
const actions = {
  closeSheet,
  status: (el) => { listState.status = el.dataset.v; render(); },
  seeSold: () => { listState.status = "sold"; listState.family = null; go("coins"); },
  toggleStack: (el) => { const g = el.dataset.v, h = hiddenStacks(); saveSettings({ hiddenStacks: h.includes(g) ? h.filter((x) => x !== g) : [...h, g] }); },
  addBullion: () => { openCoinForm(null); actions.what({ dataset: { v: "bullion" } }); },
  toggleGroup: (el) => { const g = el.dataset.v, h = hiddenGroups(); saveSettings({ hiddenGroups: h.includes(g) ? h.filter((x) => x !== g) : [...h, g] }); },
  fam: (el) => { listState.family = el.dataset.v || null; render(); },
  dir: () => { listState.dir = listState.dir === "asc" ? "desc" : "asc"; render(); },
  edit: (el) => openCoinForm(el.dataset.id),
  sell: (el) => openSell(el.dataset.id),
  editSale: (el) => openSell(el.dataset.id, true),
  unsell: (el) => {
    const c = getCoin(el.dataset.id);
    if (!c) return;
    const lot = c.lotId || c.splitFrom;
    const same = (x) => ["typeId", "year", "mint", "grade", "gradeMode", "variety", "cert"].every((k) => String(x[k] || "") === String(c[k] || ""));
    // Another piece of the same lot still in the collection (and not changed since): rejoin it.
    const home = lot ? allCoins().find((x) => x.id !== c.id && x.status === "owned" && (x.lotId || x.id) === lot && same(x)) : null;
    const undo = (docs) => toast("Back in your collection.", { label: "Undo", fn: () => { docs.forEach((d) => put("c_" + d.id, d)); toast("Undone. The sale is back."); } });
    if (home) {
      saveCoin({ ...home, ...joinExtras(home, c), qty: qtyOf(home) + qtyOf(c) });
      remove("c_" + c.id);
      undo([home, c]);
      go("coin-" + home.id);
      return;
    }
    const n = { ...c, status: "owned" };
    delete n.sold;
    delete n.splitFrom;
    const note = (typeof freeSpotOnReturn === "function" ? freeSpotOnReturn(n) : "");
    saveCoin(n);
    undo([c]);
    if (note) toast("Back in your collection." + note, { label: "Undo", fn: () => { put("c_" + c.id, c); toast("Undone. The sale is back."); } });
  },
  delete: (el) => {
    const c = getCoin(el.dataset.id);
    if (!c) return;
    const prevStatus = c.status;
    saveCoin({ ...c, status: "deleted", prevStatus, deletedAt: Date.now() });
    go("coins");
    toast("Coin deleted.", { label: "Undo", fn: () => { const x = getCoin(c.id); if (x) { const n = { ...x, status: prevStatus }; const note = n.status === "owned" ? (typeof freeSpotOnReturn === "function" ? freeSpotOnReturn(n) : "") : ""; saveCoin(n); toast("Restored." + note); } } });
  },
  received: (el) => {
    const c = getCoin(el.dataset.id);
    if (!c) return;
    const before = JSON.parse(JSON.stringify(c));
    saveCoin({ ...c, stage: "", receivedDate: today() });
    toast("Received. It's in your collection.", { label: "Undo", fn: () => { put("c_" + before.id, before); toast("Undone."); } });
  },
  pasteTrack: async () => {
    const inp = $("#trackNo");
    try {
      const t = (await navigator.clipboard.readText()).trim().replace(/\s+/g, "");
      if (!t) { toast("Nothing copied yet. Copy the tracking number first."); return; }
      draft.trackNo = t.slice(0, 40); if (inp) inp.value = draft.trackNo;
    } catch (e) { toast("Couldn't read the clipboard. Long-press the box and tap Paste."); if (inp) inp.focus(); }
  },
  ungone: (el) => {
    const c = getCoin(el.dataset.id);
    if (!c) return;
    const before = JSON.parse(JSON.stringify(c));
    const n = { ...c, status: "owned", stage: "" };
    delete n.gone;
    const note = (typeof freeSpotOnReturn === "function" ? freeSpotOnReturn(n) : "");
    saveCoin(n);
    toast("Back in your collection." + note, { label: "Undo", fn: () => { put("c_" + before.id, before); toast("Undone."); } });
  },
  restore: (el) => { const c = getCoin(el.dataset.id); if (c) { const n = { ...c, status: c.prevStatus || "owned" }; const note = n.status === "owned" ? (typeof freeSpotOnReturn === "function" ? freeSpotOnReturn(n) : "") : ""; saveCoin(n); toast("Restored." + note); } },
  purge: (el) => {
    const c = getCoin(el.dataset.id);
    if (!c) return;
    confirmSheet("Delete forever?", labelOf(c) + " will be gone for good. This can't be undone.", "Delete forever", () => { remove("c_" + c.id); toast("Deleted forever."); });
  },
  confirmOk: () => { const fn = confirmSheet.fn; confirmSheet.fn = null; closeSheet(); if (fn) fn(); },
  toastAction: () => { const t = $("#toast"); t.hidden = true; if (t._action) t._action(); },
  hideSpot: (el) => { const s = settings(); saveSettings({ hideSpot: { ...s.hideSpot, [el.dataset.v]: !el.checked } }); },
  showSold: (el) => saveSettings({ showSold: el.checked, soldAutoDone: true }),
  shelfStyle: (el) => saveSettings({ shelfStyle: el.dataset.v === "safe" ? "safe" : "bookcase" }),
  newAlbum: openNewAlbum,
  missing: (el) => openMissing(el.dataset.id),
  editSlots: (el) => { albumEdit.id = albumEdit.id === el.dataset.id ? null : el.dataset.id; render(); },
  addSpot: (el) => openAddSpot(el.dataset.id),
  shareApp: () => shareAppLink(),
  reorderAlbums: () => { albumsView.reorder = !albumsView.reorder; render(); },
  moveAlbum: (el) => moveAlbum(el.dataset.id, +el.dataset.d, !!el.dataset.whole),
  albumAddType: () => {
    const box = $("#albumTypes");
    if (!box) return;
    box.insertAdjacentHTML("beforeend", `<div class="type-row"><select name="typeId" data-albumtype><option value="">Choose a coin type…</option>${typeOptions("")}</select><button type="button" class="type-del" data-act="albumDelType" aria-label="Remove this type">✕</button></div>`);
  },
  albumDelType: (el) => { const r = el.closest(".type-row"); if (r) r.remove(); albumYearsFromTypes(); },
  editAlbum: (el) => openEditAlbum(el.dataset.id),
  spotEdit: (el) => openSpotEdit(el.dataset.id, +el.dataset.i),
  moveSpot: (el) => {
    const a = withSlotIds(getAlbum(el.dataset.id));
    if (!a) return;
    const i = +el.dataset.i, j = i + (+el.dataset.d);
    const slots = (a.slots || []).slice();
    if (j < 0 || j >= slots.length || slots[i].y !== slots[j].y) return; // years stay in order
    [slots[i], slots[j]] = [slots[j], slots[i]];
    put("a_" + a.id, { ...a, slots });
  },
  pickSpotV: (el) => { const i = $("#spotV"); if (i) i.value = el.dataset.v; },
  deleteSpot: (el) => {
    const a = getAlbum(el.dataset.id);
    if (!a) return;
    const k = el.dataset.k;
    const gone = (a.slots || []).find((x) => slotKey(x) === k);
    const freed = gone && gone.id ? allCoins().filter((c) => c.slotId === gone.id) : [];
    put("a_" + a.id, { ...a, slots: (a.slots || []).filter((x) => slotKey(x) !== k) });
    freed.forEach((c) => { const x = { ...c }; delete x.slotId; saveCoin(x); }); // they fall back to their plain date spot
    if (!$("#sheet").hidden) closeSheet();
    toast("Spot removed.", { label: "Undo", fn: () => { put("a_" + a.id, a); freed.forEach((c) => saveCoin(c)); } });
  },
  toggleSlot: (el) => {
    const a = getAlbum(el.dataset.id);
    const k = el.dataset.k;
    const removed = new Set(a.removed || []);
    removed.has(k) ? removed.delete(k) : removed.add(k);
    put("a_" + a.id, { ...a, removed: [...removed] });
    if (!$("#sheet").hidden) closeSheet();
  },
  deleteAlbum: (el) => {
    const a = getAlbum(el.dataset.id);
    if (!a) return;
    const inAlbum = allCoins().filter((c) => c.albumId === a.id);
    inAlbum.forEach((c) => saveCoin({ ...c, albumId: "" }));
    remove("a_" + a.id);
    go("albums");
    toast("Album deleted. Its coins are still in your collection.", { label: "Undo", fn: () => { put("a_" + a.id, a); inAlbum.forEach((c) => { const x = getCoin(c.id); if (x) saveCoin({ ...x, albumId: a.id }); }); } });
  },
  // form
  gmode: (el) => { draft.gradeMode = el.dataset.v; if (draft.gradeMode === "raw" && draft.holder === "Slab") draft.holder = ""; if (draft.gradeMode === "cert" && draft.grade === "Junk") draft.grade = ""; renderCoinForm(); },
  pickType: (el) => pickType(el.dataset.id),
  what: (el) => {
    const v = el.dataset.v;
    draft._what = v === "roll" ? "us" : v;
    if (v === "set" || v === "roll" || v === "bullion") { draft.item = v; draft.family = v === "set" ? "Sets" : v === "bullion" ? "Bullion" : ""; draft.typeId = ""; draft.mint = ""; }
    else delete draft.item;
    if (v === "bullion") Object.assign(draft, { bShape: "Bar", bPurity: "0.999", metal: "Silver", typeName: "Bullion" });
    if (v === "other") { draft.typeId = ""; draft.mint = ""; }
    renderCoinForm();
  },
  addToCase: (el) => {
    const c = getCoin(el.dataset.id);
    if (!c) return;
    openCoinForm(null);
    Object.assign(draft, { _what: "us", holder: c.holder, caseName: c.caseName, source: c.source || "", acquired: c.acquired || "" });
    delete draft._sourceKind;
    renderCoinForm();
  },
  retype: () => retypeDraft(),
  toggleProof: (el) => {
    if (!draft) return;
    const was = draft._proof;
    draft._proof = el.checked;
    const t = TYPE_BY_ID[draft.typeId];
    // Remember what was set before switching to proof, so switching back puts it back.
    if (draft._proof && !was) draft._preProof = { grade: draft.grade, mint: draft.mint };
    if (!draft._proof && draft._preProof && (!draft.grade || isProofGrade(draft.grade))) draft.grade = draft._preProof.grade; // switching back: put the old grade back
    else if (isProofGrade(draft.grade) !== draft._proof) draft.grade = "";
    if (!draft._proof && draft._preProof && !draft.mint && mintChoices(t, false).includes(draft._preProof.mint)) draft.mint = draft._preProof.mint; // switching back: put the old mint back
    else if (draft.mint && !mintChoices(t, draft._proof).includes(draft.mint)) draft.mint = "";
    if (!draft._proof) delete draft._preProof;
    const y = $(".sheet").scrollTop;
    renderCoinForm();
    $(".sheet").scrollTop = y;
  },
  rmPhoto: (el) => { (draft[el.dataset.k || "photos"] || []).splice(+el.dataset.i, 1); const y = $(".sheet").scrollTop; renderCoinForm(); $(".sheet").scrollTop = y; },
  resetLabel: () => { draft.labelEdited = false; draft.label = ""; renderCoinForm(); },
};

// Actions that change saved data; inert in a view-only snapshot. (+ Add coin stays as a try-out.)
const SNAPSHOT_BLOCK = new Set(("edit editSale sell unsell delete restore purge confirmOk boxNew boxEdit boxDelete boxAdd newAlbum editAlbum deleteAlbum editSlots addSpot spotEdit moveSpot " +
  "hideSpot showSold shelfStyle slotWant slotWantAdd slotUnwant missing missAdd missAll wantEdit wantGot wantNew wantRemove wlNew wlDelete " +
  "export openImport undoImport openReport openSnapshot openBackup doBackup reorderAlbums moveAlbum").split(" "));
document.addEventListener("click", (e) => {
  const goEl = e.target.closest("[data-go]");
  if (goEl) { e.preventDefault(); go(goEl.dataset.go); return; }
  const actEl = e.target.closest("[data-act]");
  if (actEl && actions[actEl.dataset.act]) {
    if (store.mode === "snapshot" && SNAPSHOT_BLOCK.has(actEl.dataset.act)) { e.preventDefault(); toast("This is a view-only copy."); return; }
    if (actEl.tagName !== "INPUT") e.preventDefault();
    actions[actEl.dataset.act](actEl, e);
    return;
  }
  if (!e.target.closest("#menu") && !e.target.closest("#menuBtn")) closeMenu();
  if (!e.target.closest(".typeahead")) { const l = $("#typeList"); if (l) l.hidden = true; }
});
$("#menuBtn").addEventListener("click", () => {
  const m = $("#menu");
  m.hidden = !m.hidden;
  $("#menuBtn").setAttribute("aria-expanded", String(!m.hidden));
});
$("#fab").addEventListener("click", () => openCoinForm(null));

let spotTimer = null;
document.addEventListener("input", (e) => {
  const el = e.target;
  if (el.id === "typeSearch") { showTypeList(el.value); return; }
  if (el.id === "spotY") { refreshSpotHints(); return; }
  if (el.dataset.list === "q") { listState.q = el.value; render(); return; }
  if (el.dataset.setting) {
    clearTimeout(spotTimer);
    spotTimer = setTimeout(() => saveSettings({ [el.dataset.setting]: el.value.trim() }, true), 700);
    return;
  }
  if (el.dataset.spot) {
    clearTimeout(spotTimer);
    spotTimer = setTimeout(() => {
      const spot = {};
      $$("[data-spot]").forEach((i) => { spot[i.dataset.spot] = num(i.value); });
      const stamp = new Date().toISOString();
      saveSettings({ spot, spotUpdated: stamp }, true); // quiet: a redraw here would close the box you're typing in
      const u = $("#spotStamp"); if (u) u.textContent = "Last updated " + stampText(stamp) + ".";
    }, 700);
    return;
  }
  if (!draft) return;
  if (el.dataset.na) { draft._newAlbum[el.dataset.na] = el.value; return; }
  const f = el.dataset.f;
  if (!f) return;
  draft[f] = el.value;
  if (f === "label") { draft.labelEdited = true; return; }
  if (f === "source") { const h = $("#inhHint"); if (h) h.hidden = !isInherited(draft); return; }
  if (f === "year" && TYPE_BY_ID[draft.typeId] && TYPE_BY_ID[draft.typeId].metalByYear) {
    const before = draft.metal;
    applyYearMetal(draft);
    if (draft.metal !== before) { const ms = $("[data-f=metal]"), oz = $("[data-f=oz]"); if (ms) ms.value = draft.metal; if (oz) oz.value = draft.oz; toast("Metal set to " + draft.metal + " for " + draft.year + "."); }
  }
  if (f === "_grams" || f === "_purity") gramsToOz(draft);
  if (f === "typeName") { if (!OTHER_KINDS.includes(draft.family)) draft.family = ""; if (TYPE_BY_ID[draft.typeId] && shortName(TYPE_BY_ID[draft.typeId]) !== el.value) draft.typeId = ""; }
  if (!draft.labelEdited) { const li = $("#labelInput"); if (li) li.value = autoLabel(draft); }
  if (itemOf(draft) === "bullion" && (f === "bWeight" || f === "bPurity")) draft.oz = bullionOz(draft) ? String(bullionOz(draft)) : "";
  if (f === "oz" && itemOf(draft) === "set") draft._ozEdited = el.value !== "";
  if (f === "rollCount") draft._countEdited = true;
  if (itemOf(draft) === "set" && (f === "year" || f === "setKind")) { autoSetOz(draft); const oi = $("[data-f=oz]"); if (oi && !draft._ozEdited) oi.value = draft.oz; }
  refreshFormHints();
});
document.addEventListener("focusin", (e) => { if (e.target.id === "typeSearch") showTypeList(e.target.value); });
document.addEventListener("change", (e) => {
  const el = e.target;
  if (el.dataset.list) { listState[el.dataset.list] = el.value; render(); return; }
  if (el.dataset.actChange === "useOther") { const o = savedOthers()[+el.value]; if (o) { Object.assign(draft, { typeName: o.name, denom: o.denom, family: o.family, metal: o.metal, oz: o.oz }); const y = $(".sheet").scrollTop; renderCoinForm(); $(".sheet").scrollTop = y; } return; }
  if (el.id === "photoInput") { addPhotos([...el.files]); return; }
  if (el.id === "receiptInput") { addPhotos([...el.files], "receiptPhotos"); return; }
  if (el.id === "spotM") { refreshSpotHints(); return; }
  if (el.dataset.albumtype != null) { albumYearsFromTypes(); return; }
  if (el.id === "albumLayout") { const h = $("#albumHint"); if (h) h.textContent = el.value === "set" ? "Add each coin type your type set holds. Each gets one spot, and any date fills it. The years are just for your reference." : "Use the years printed on your album. Each coin type gets spots for the dates and mint marks struck in those years."; return; }
  if (!draft) return;
  if (el.dataset.na) { draft._newAlbum[el.dataset.na] = el.value; if (el.dataset.na === "brand") renderCoinForm(); return; }
  if (el.dataset.flist) { // checkbox lists (mint errors, problems)
    const k = el.dataset.flist, set = new Set(listOf(draft[k]));
    if (el.checked) set.add(el.value); else set.delete(el.value);
    draft[k] = [...set];
    const sm = el.closest("details") && el.closest("details").querySelector("summary");
    if (sm && k === "problems") sm.textContent = "Errors and problems" + (set.size ? " · Details" : "");
    refreshFormHints(); return;
  }
  if (el.dataset.fcheck) {
    draft[el.dataset.fcheck] = el.checked;
    if (el.hasAttribute("data-rerender")) { const y = $(".sheet").scrollTop; renderCoinForm(); $(".sheet").scrollTop = y; return; }
    refreshFormHints(); return;
  }
  if (el.dataset.f) {
    draft[el.dataset.f] = el.value;
    if (el.dataset.f === "metal" && !MELT_OF_METAL[el.value]) draft.oz = "";
    if (el.dataset.f === "_sourceKind") draft.source = el.value === "Other" ? "" : el.value;
    if (el.dataset.f === "albumId" && draft._isNew && !draft.typeId) { const al = getAlbum(el.value); if (al && albumTypes(al).length === 1) { pickType(albumTypes(al)[0]); return; } }
    if (el.dataset.f === "setKind") autoSetOz(draft);
    if (el.hasAttribute("data-rerender")) {
      const y = $(".sheet").scrollTop;
      renderCoinForm();
      $(".sheet").scrollTop = y;
    }
  }
});
document.addEventListener("toggle", (e) => { // remember which sections you opened, so redrawing the form keeps them open
  const k = e.target.dataset && e.target.dataset.sec;
  if (k && draft) (draft._open = draft._open || {})[k] = e.target.open;
}, true);
document.addEventListener("submit", (e) => {
  e.preventDefault();
  if (e.target.id === "coinForm") saveDraft();
  else if (e.target.id === "sellForm") doSell(e.target);
  else if (e.target.id === "albumForm") doNewAlbum(e.target);
  else if (e.target.id === "spotForm") saveSpot(e.target);
  else if (e.target.id === "editAlbumForm") saveEditAlbum(e.target);
  else if (e.target.id === "spotEditForm") saveSpotEdit(e.target);
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { dismissSheet(); closeMenu(); } });

// Start once every script (sheets.js, photofill.js) has loaded.
document.addEventListener("DOMContentLoaded", () => { render(); initStore(); });
