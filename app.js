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
const today = () => new Date().toISOString().slice(0, 10);
const TYPE_BY_ID = Object.fromEntries(COIN_TYPES.map((t) => [t.id, t]));
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
  showSold: false,
  soldAutoDone: false,
  bookEdition: "",
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
    store.mode = "memory";
    showBanner("Practice mode: open this page from Claude to save your coins. Nothing typed here is kept.");
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

function put(key, obj) {
  const body = JSON.parse(JSON.stringify(obj));
  store.docs.set(key, body);
  if (key !== "history" && typeof scheduleHistory === "function") scheduleHistory(); // value over time
  render();
  if (store.mode !== "db" || !store.coll) return Promise.resolve();
  const prev = writeChains.get(key) || Promise.resolve();
  const next = prev.then(() => store.coll.doc(key).set(body)).catch((e) => {
    toast(e && e.code === "quota_exceeded" ? "Storage is full. Delete some old coins or photos." : "Couldn't save that change. Try again.");
  });
  writeChains.set(key, next);
  return next;
}
function remove(key) {
  if (store.mode === "snapshot") return Promise.resolve();
  store.docs.delete(key);
  render();
  if (store.mode !== "db" || !store.coll) return Promise.resolve();
  const prev = writeChains.get(key) || Promise.resolve();
  const next = prev.then(() => store.coll.doc(key).delete()).catch(() => toast("Couldn't delete that. Try again."));
  writeChains.set(key, next);
  return next;
}

const settings = () => ({ ...DEFAULT_SETTINGS, ...(store.docs.get("settings") || {}), spot: { ...DEFAULT_SETTINGS.spot, ...((store.docs.get("settings") || {}).spot || {}) } });
const saveSettings = (patch) => put("settings", { ...settings(), ...patch });
const allCoins = () => [...store.docs.values()].filter((d) => d.kind === "coin");
const ownedCoins = () => allCoins().filter((c) => c.status === "owned");
const soldCoins = () => allCoins().filter((c) => c.status === "sold");
const deletedCoins = () => allCoins().filter((c) => c.status === "deleted");
const albums = () => [...store.docs.values()].filter((d) => d.kind === "album").sort((a, b) => albumTitle(a).localeCompare(albumTitle(b)));
const getCoin = (id) => store.docs.get("c_" + id);
const getAlbum = (id) => store.docs.get("a_" + id);
const saveCoin = (c) => put("c_" + c.id, c);

/* ---------- coin math ---------- */
function spotPerOz(metalKey) {
  const s = num(settings().spot[metalKey]);
  if (s == null) return null;
  return metalKey === "copper" ? s * LB_PER_TROY_OZ : s;
}
const meltKey = (c) => MELT_OF_METAL[c.metal] || null;
function meltEach(c) {
  const m = meltKey(c);
  const oz = num(c.oz);
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
  const bt = bookTable(c);
  if (!bt || !c.year) return [];
  const base = bookBase(c, bt.kind);
  return Object.keys(bt.t.rows).filter((k) => k === base || k.startsWith(base + "|")).map((k) => k.split("|")[1] || "");
}
// Returns {price, grade, kind} for the highest listed grade at or below the coin's grade.
function bookLookup(c) {
  if (!c.year || !c.grade || c.grade === "Other" || c.grade === "Junk") return null;
  const bt = bookTable(c);
  if (!bt) return null;
  const row = bt.t.rows[bookKey(c, bt.kind)];
  if (!row) return { none: true, kind: bt.kind };
  const r = gradeRank(c.grade);
  let best = null;
  bt.t.grades.forEach((g, i) => { if (gradeRank(g) <= r && row[i] != null) best = { price: row[i], grade: g, kind: bt.kind }; });
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
  return "Red Book" + ed + ": " + money(b.price) + " (" + b.grade.replace(/^PR/, "PF") + (b.kind === "fbl" ? " FBL" : b.kind === "sms" ? " SMS" : "") + ")" + (b.asked && b.asked !== b.grade ? ", the closest listed price below " + b.asked.replace(/^PR/, "PF") : "");
}

function valueEach(c) {
  if (isJunk(c)) return meltEach(c);
  return num(c.value) ?? bookPrice(c);
}
function valueSource(c) {
  if (isJunk(c)) return "melt";
  if (num(c.value) != null) return "entered";
  if (bookPrice(c) != null) return "book";
  return meltEach(c) != null ? "melt" : null;
}
// Best available value: entered value, else melt.
const bestEach = (c) => valueEach(c) ?? meltEach(c);
const qtyOf = (c) => Math.max(1, num(c.qty) || 1);
const isInherited = (c) => (c.source || "").trim().toLowerCase() === "inherited";
const sum = (arr, f) => arr.reduce((t, x) => t + (f(x) || 0), 0);

function gradeText(c) {
  const g = c.grade === "Other" ? c.customGrade || "Other" : c.grade;
  const extra = (c.sms && !isProofGrade(c.grade) && hasSms(c) ? " SMS" : "") + (c.fbl && !isProofGrade(c.grade) && PRICE_BOOK.series[c.typeId] && PRICE_BOOK.series[c.typeId].fbl ? " FBL" : "") + (c.variety ? " · " + c.variety : "");
  if (c.gradeMode === "cert") return [c.service === "Other" ? c.customService || "Other" : c.service, g].filter(Boolean).join(" ") + extra;
  return (g ? "Raw " + g : "Raw") + extra;
}
function autoLabel(c) {
  const date = c.year ? String(c.year) + (c.mint ? "-" + c.mint : "") : "";
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

function thumbHtml(c) {
  const p = (c.photos || [])[0];
  if (p) return `<img class="thumb" src="${esc(photoSrc(p))}" alt="" loading="lazy">`;
  return `<span class="thumb" aria-hidden="true">${esc((c.typeName || c.label || "?").trim().charAt(0).toUpperCase())}</span>`;
}
const photoSrc = (p) => (p.id ? "/_blob/" + p.id : p.url || "");

/* ---------- navigation ---------- */
const VIEWS = ["home", "value", "albums", "coins", "guide", "options"];
function currentRoute() {
  const h = location.hash.replace(/^#/, "");
  if (VIEWS.includes(h)) return { view: h };
  if (h.startsWith("coin-")) return { view: "coin", id: h.slice(5) };
  if (h.startsWith("album-")) return { view: "album", id: h.slice(6) };
  return { view: "home" };
}
function go(hash) {
  closeMenu();
  if (location.hash === "#" + hash) render(); else location.hash = hash;
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });
function closeMenu() { $("#menu").hidden = true; $("#menuBtn").setAttribute("aria-expanded", "false"); }

/* ---------- rendering ---------- */
function render() {
  const r = currentRoute();
  const main = $("#view");
  if (store.mode === "loading") { main.innerHTML = `<div class="empty">Opening your cabinet…</div>`; return; }
  const menuKey = r.view === "coin" ? "coins" : r.view === "album" ? "albums" : r.view;
  $$("#menu button").forEach((b) => b.classList.toggle("on", b.dataset.go === menuKey));
  const fn = { home: viewHome, value: viewValue, albums: viewAlbums, album: viewAlbum, coins: viewCoins, coin: viewCoin, guide: viewGuide, options: viewOptions }[r.view];
  // Keep the search box focus when the list re-renders.
  const active = document.activeElement;
  const keepSearch = active && active.id === "coinSearch" ? active.selectionStart : null;
  main.innerHTML = fn(r);
  if (keepSearch != null) { const s = $("#coinSearch"); if (s) { s.focus(); s.setSelectionRange(keepSearch, keepSearch); } }
}

function coinRow(c, opts = {}) {
  const v = bestEach(c);
  const m = meltEach(c);
  const q = qtyOf(c);
  return `<button class="coin-row" data-go="coin-${esc(c.id)}">
    ${thumbHtml(c)}
    <span class="coin-main">
      <span class="coin-label">${esc(labelOf(c))}</span>
      <span class="coin-sub">${q > 1 ? `<span class="qty">×${q}</span> ` : ""}${c.status === "sold" && c.sold && c.sold.date ? "Sold " + esc(c.sold.date) + " · " : ""}${esc(gradeText(c))}${c.metal ? " · " + esc(c.metal) : ""}${isInherited(c) ? `<span class="dns" title="Inherited: do not sell">Do not sell</span>` : ""}${c.status === "sold" ? `<span class="sold-tag">Sold</span>` : ""}</span>
    </span>
    <span class="coin-val">${c.status === "sold" ? money(num(c.sold && c.sold.amount)) : money(v == null ? null : v * q)}${m != null && c.status !== "sold" ? `<div class="melt">melt ${money(m * q)}</div>` : ""}</span>
  </button>`;
}

function viewHome() {
  const s = settings();
  const owned = ownedCoins();
  const count = sum(owned, qtyOf);
  const total = sum(owned, (c) => (bestEach(c) || 0) * qtyOf(c));
  const melt = sum(owned, (c) => (meltEach(c) || 0) * qtyOf(c));
  const gainCoins = owned.filter((c) => !isInherited(c) && num(c.paid) != null);
  const paid = sum(gainCoins, (c) => num(c.paid) * qtyOf(c));
  const gainVal = sum(gainCoins, (c) => (bestEach(c) || 0) * qtyOf(c));
  const gain = gainCoins.length ? gainVal - paid : null;
  const noValue = owned.filter((c) => valueSource(c) === "melt" && !isJunk(c)).length;
  const fromBook = owned.filter((c) => valueSource(c) === "book").length;

  let html = `<h1>Your cabinet</h1>
  <div class="stats">
    <div class="stat wide"><div class="k">Collection value</div><div class="v">${money(total, "$0.00")}</div>
      ${fromBook ? `<div class="small muted">${fromBook} coin${fromBook > 1 ? "s" : ""} valued from the Red Book.</div>` : ""}
      ${noValue ? `<div class="small muted">${noValue} coin${noValue > 1 ? "s" : ""} without a value ${noValue > 1 ? "are" : "is"} counted at melt.</div>` : ""}</div>
    <div class="stat"><div class="k">Coins</div><div class="v">${count}</div></div>
    <div class="stat"><div class="k">Melt value</div><div class="v">${money(melt, "$0.00")}</div></div>
    <div class="stat"><div class="k">Paid</div><div class="v">${money(paid, "$0.00")}</div></div>
    <div class="stat"><div class="k">Gain</div><div class="v ${signCls(gain)}">${gain == null ? "—" : money(gain)}</div><div class="small muted">${gain == null ? "Add prices paid" : pct(paid ? gain / paid : null) + " · inherited not counted"}</div></div>
  </div>`;

  if (typeof historyCard === "function") html += historyCard();

  // Melt Value by Metal, only for metals in the collection
  const metalRows = SPOT_METALS.map((m) => {
    const cs = owned.filter((c) => meltKey(c) === m.key && num(c.oz));
    if (!cs.length) return "";
    const oz = sum(cs, (c) => num(c.oz) * qtyOf(c));
    const mv = sum(cs, (c) => (meltEach(c) || 0) * qtyOf(c));
    return `<div class="rowline"><span>${m.label}<div class="small muted">${sum(cs, qtyOf)} coins · ${oz.toFixed(m.key === "copper" ? 2 : 3)} oz</div></span><span class="num">${spotPerOz(m.key) == null ? `<span class="muted small">no spot price</span>` : money(mv)}</span></div>`;
  }).join("");
  if (metalRows) html += `<h2>Melt Value by Metal</h2><div class="card">${metalRows}</div>`;

  if (s.showSold) html += soldCard();

  // Spot prices
  const shown = SPOT_METALS.filter((m) => !s.hideSpot[m.key]);
  if (shown.length) {
    html += `<h2>Spot prices</h2><div class="card">${shown.map((m) => `<div class="rowline"><span>${m.label}</span><span class="num">${num(s.spot[m.key]) == null ? `<button class="link-btn" data-go="options">Enter price</button>` : money(num(s.spot[m.key])) + ` <span class="muted small">/ ${m.unit}</span>`}</span></div>`).join("")}
      <div class="small muted" style="margin-top:6px">${s.spotUpdated ? "Updated " + esc(s.spotUpdated) + " · " : ""}<button class="link-btn" data-go="options">Change</button></div></div>`;
  }


  const recent = owned.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5);
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

function soldCard() {
  const sold = soldCoins().filter((c) => !isInherited(c));
  const revenue = sum(sold, (c) => num(c.sold && c.sold.amount));
  const costs = sum(sold, (c) => (num(c.sold && c.sold.shipping) || 0) + (num(c.sold && c.sold.insurance) || 0));
  const basis = sum(sold, (c) => (num(c.paid) || 0) * qtyOf(c));
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
    <div class="list">${top.map((c) => coinRow(c)).join("")}</div>
    ${premium.length ? `<h2>Highest premium over melt</h2><div class="card">${premium.map(({ c, p }) => `<div class="rowline"><button class="link-btn" data-go="coin-${esc(c.id)}">${esc(labelOf(c))}</button><span class="num ${signCls(p)}">${pct(p)}</span></div>`).join("")}</div>` : ""}
    <p class="small muted">Values are the ones you enter, then Red Book values, then melt. Use <b>Check eBay sold</b> on any coin to see recent real sale prices.</p>`;
}

/* --- Your Coins --- */
const listState = { family: null, metal: "", cert: "", status: "owned", q: "", sort: "year", dir: "asc" };
function viewCoins() {
  const base = listState.status === "sold" ? soldCoins() : ownedCoins();
  const famCounts = {};
  base.forEach((c) => { famCounts[familyOf(c)] = (famCounts[familyOf(c)] || 0) + qtyOf(c); });
  const fams = [...new Set([...COMMON_FAMILIES, ...Object.keys(famCounts)])];
  let list = base.filter((c) =>
    (!listState.family || familyOf(c) === listState.family) &&
    (!listState.metal || c.metal === listState.metal) &&
    (!listState.cert || c.gradeMode === listState.cert) &&
    (!listState.q || (labelOf(c) + " " + gradeText(c) + " " + (c.notes || "") + " " + (c.source || "")).toLowerCase().includes(listState.q.toLowerCase())));
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
      <button data-act="status" data-v="owned" class="${listState.status === "owned" ? "on" : ""}">In collection (${sum(ownedCoins(), qtyOf)})</button>
      <button data-act="status" data-v="sold" class="${listState.status === "sold" ? "on" : ""}">Sold (${sum(soldCoins(), qtyOf)})</button>
    </div>
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

/* --- Coin detail --- */
function viewCoin(r) {
  const c = getCoin(r.id);
  if (!c || c.status === "deleted") return `<div class="card empty">That coin isn't here. <button class="link-btn" data-go="coins">Back to Your Coins</button></div>`;
  const q = qtyOf(c);
  const v = valueEach(c);
  const m = meltEach(c);
  const album = c.albumId ? getAlbum(c.albumId) : null;
  const row = (k, val) => (val == null || val === "" ? "" : `<div class="rowline"><span class="muted">${k}</span><span class="num" style="text-align:right">${val}</span></div>`);
  const sold = c.sold || {};
  return `<button class="link-btn" data-go="coins">← Your Coins</button>
    <h1 style="margin-top:10px">${esc(labelOf(c))}${isInherited(c) ? ` <span class="dns">Inherited · do not sell</span>` : ""}</h1>
    ${mintageLine(c)}
    ${(c.photos || []).length ? `<div class="detail-photos">${c.photos.map((p) => `<img src="${esc(photoSrc(p))}" alt="Coin photo">`).join("")}</div>` : ""}
    <div class="card">
      ${row("Grade", esc(gradeText(c)))}
      ${c.gradeMode === "cert" ? row("Cert number", esc(c.cert)) : ""}
      ${row("Quantity", q > 1 ? q : null)}
      ${row(isJunk(c) ? "Value (junk = melt)" : valueSource(c) === "book" ? "Value each (Red Book)" : "Value each", money(v))}
      ${valueSource(c) === "entered" && bookPrice(c) != null ? row("Red Book", money(bookPrice(c)) + ` <span class="muted small">${esc(bookLookup(c).grade.replace(/^PR/, "PF"))}</span>`) : ""}
      ${row("Melt each", m == null ? (meltKey(c) ? "Enter spot price" : null) : money(m))}
      ${q > 1 ? row("Total value", money((bestEach(c) || 0) * q)) : ""}
      ${row("Paid each", num(c.paid) == null ? null : money(num(c.paid)))}
      ${row("Metal", esc([c.metal, num(c.oz) ? num(c.oz) + " oz" : ""].filter(Boolean).join(" · ")))}
      ${row("Source", esc(c.source))}
      ${row("Acquired", esc(c.acquired))}
      ${row("Album", album ? `<button class="link-btn" data-go="album-${esc(album.id)}">${esc(albumTitle(album))}</button>` : null)}
    </div>
    ${c.status === "sold" ? `<div class="card"><b>Sold</b>${row("Date", esc(sold.date))}${row("Sold for", money(num(sold.amount)))}${row("Shipping", num(sold.shipping) == null ? null : money(num(sold.shipping)))}${row("Insurance", num(sold.insurance) == null ? null : money(num(sold.insurance)))}${row("Where", esc(whereText(sold)))}${row("Sold to", esc(sold.to))}</div>` : ""}
    ${c.notes ? `<div class="card"><div class="muted small">Notes</div><div style="white-space:pre-wrap">${esc(c.notes)}</div></div>` : ""}
    <a class="btn block" style="display:block;text-align:center;text-decoration:none;color:inherit" href="${esc(ebayUrl(c))}" target="_blank" rel="noopener">Check eBay sold ↗</a>
    <div class="btn-row">
      <button class="btn primary" data-act="edit" data-id="${esc(c.id)}">Edit</button>
      ${c.status === "owned" ? `<button class="btn" data-act="sell" data-id="${esc(c.id)}">Mark as sold</button>` : `<button class="btn" data-act="editSale" data-id="${esc(c.id)}">Edit sale</button><button class="btn" data-act="unsell" data-id="${esc(c.id)}">Move back to collection</button>`}
      <button class="btn danger" data-act="delete" data-id="${esc(c.id)}">Delete</button>
    </div>`;
}

/* --- Albums --- */
const albumTitle = (a) => a.name || [a.brand, a.number].filter(Boolean).join(" ") || "Album";
function albumSlots(a) {
  const removed = new Set(a.removed || []);
  return (a.slots || []).filter((s) => !removed.has(s.y + "|" + s.m));
}
function buildSlots(typeId, start, end) {
  const t = TYPE_BY_ID[typeId];
  if (!t) return [];
  const out = [];
  if (EXACT_SLOTS[typeId]) {
    EXACT_SLOTS[typeId].forEach(([y, ms]) => { if (y >= start && y <= end) ms.split(" ").forEach((m) => out.push({ y, m: normMint(m) })); });
  } else {
    for (let y = start; y <= end; y++) t.mints.forEach((m) => out.push({ y, m: normMint(m) }));
  }
  return out;
}
function albumStats(a) {
  const coins = ownedCoins().filter((c) => c.albumId === a.id);
  const slots = albumSlots(a);
  const filled = new Map();
  slots.forEach((s) => {
    const k = s.y + "|" + s.m;
    const hit = coins.find((c) => num(c.year) === s.y && normMint(c.mint) === s.m);
    if (hit) filled.set(k, hit);
  });
  return {
    coins, slots, filled,
    owned: filled.size, total: slots.length,
    value: sum(coins, (c) => (bestEach(c) || 0) * qtyOf(c)),
    melt: sum(coins, (c) => (meltEach(c) || 0) * qtyOf(c)),
  };
}
function viewAlbums() {
  const list = albums();
  return `<h1>Albums</h1>
    <button class="btn primary block" data-act="newAlbum">+ New album</button>
    <div style="margin-top:12px">${list.length ? list.map((a) => {
      const st = albumStats(a);
      const done = st.total && st.owned === st.total;
      return `<button class="card" style="display:block;width:100%;text-align:left" data-go="album-${esc(a.id)}">
        <div style="display:flex;justify-content:space-between;gap:10px"><b>${esc(albumTitle(a))}${done ? `<span class="check" aria-label="Complete">✓</span>` : ""}</b><span class="num">${st.owned}/${st.total}</span></div>
        <div class="small muted">${esc(TYPE_BY_ID[a.typeId] ? TYPE_BY_ID[a.typeId].name : "")} · ${a.start}–${a.end} · ${money(st.value, "$0.00")}</div>
        <div class="bar"><i style="width:${st.total ? (st.owned / st.total) * 100 : 0}%"></i></div></button>`;
    }).join("") : `<div class="card empty">No albums yet. Make one here, or pick an album number when you add a coin.</div>`}</div>`;
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
    <div class="small muted" style="margin:-8px 0 12px">${esc([a.brand, a.number && "No. " + a.number].filter(Boolean).join(" · "))} · ${esc(TYPE_BY_ID[a.typeId] ? TYPE_BY_ID[a.typeId].name : "")} · ${a.start}–${a.end}</div>
    <div class="stats">
      <div class="stat"><div class="k">Owned</div><div class="v">${st.owned}/${st.total}</div></div>
      <div class="stat"><div class="k">Missing</div><div class="v">${st.total - st.owned}</div><button class="link-btn small" data-act="missing" data-id="${esc(a.id)}">Show missing</button></div>
      <div class="stat"><div class="k">Album value</div><div class="v">${money(st.value, "$0.00")}</div></div>
      <div class="stat"><div class="k">Album melt</div><div class="v">${money(st.melt, "$0.00")}</div></div>
    </div>
    <div class="bar" style="margin:12px 0 16px"><i style="width:${st.total ? (st.owned / st.total) * 100 : 0}%"></i></div>
    ${editing ? `<div class="banner" style="margin:0 0 10px">Tap a slot to remove it (for dates that were never struck). Tap again to bring it back.</div>` : ""}
    <div class="album-grid">${(editing ? a.slots || [] : st.slots).map((s) => {
      const k = s.y + "|" + s.m;
      const hit = st.filled.get(k);
      const gone = (a.removed || []).includes(k);
      const lab = s.y + (s.m ? "-" + s.m : "");
      if (editing) return `<button class="slot" style="${gone ? "opacity:.35;text-decoration:line-through" : ""}" data-act="toggleSlot" data-id="${esc(a.id)}" data-k="${esc(k)}">${esc(lab)}</button>`;
      return hit ? `<button class="slot have" data-go="coin-${esc(hit.id)}">${esc(lab)}<span class="g">${esc(gradeText(hit).replace(/^Raw /, ""))}</span></button>` : `<div class="slot">${esc(lab)}<span class="g">open</span></div>`;
    }).join("")}</div>
    ${extras.length ? `<h2>Also in this album</h2><div class="list">${extras.map((c) => coinRow(c)).join("")}</div>` : ""}
    <div class="btn-row">
      <button class="btn" data-act="editSlots" data-id="${esc(a.id)}">${editing ? "Done editing slots" : "Edit slots"}</button>
      <button class="btn danger" data-act="deleteAlbum" data-id="${esc(a.id)}">Delete album</button>
    </div>
    <p class="small muted">${EXACT_SLOTS[a.typeId] ? "Slots follow the dates and mint marks this series was struck." : "Slots include every year and mint mark for this series. Use Edit slots to remove any your album doesn't have."}</p>`;
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
      <div class="hint">Type today's prices. ${s.spotUpdated ? "Last updated " + esc(s.spotUpdated) + "." : ""} <a href="https://www.kitco.com/" target="_blank" rel="noopener">Look up current prices ↗</a></div>
    </div>
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
    <h2>Recently deleted</h2>
    ${del.length ? `<div class="list">${del.map((c) => `<div class="coin-row">${thumbHtml(c)}<span class="coin-main"><span class="coin-label">${esc(labelOf(c))}</span><span class="coin-sub">${esc(gradeText(c))}</span></span>
      <button class="btn" data-act="restore" data-id="${esc(c.id)}">Restore</button><button class="btn danger" data-act="purge" data-id="${esc(c.id)}" aria-label="Delete forever">✕</button></div>`).join("")}</div>` : `<div class="card empty">Nothing deleted.</div>`}
    <p class="small muted">${store.mode === "db" ? "Your coins are saved to your Claude account and are private to you." : "Practice mode: nothing is saved."}</p>`;
}

/* ---------- sheets (pop-ups) ---------- */
function openSheet(html) {
  const w = $("#sheet");
  w.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
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
$("#sheet").addEventListener("click", (e) => { if (e.target.id === "sheet") closeSheet(); });

/* --- Add / edit coin --- */
let draft = null;
function blankCoin() {
  return { kind: "coin", id: uid(), status: "owned", typeId: "", typeName: "", family: "", denom: "", year: "", mint: "", gradeMode: "raw", grade: "", customGrade: "",
    service: "PCGS", customService: "", cert: "", metal: "", oz: "", qty: 1, paid: "", value: "", source: "", acquired: "", albumId: "", notes: "", photos: [], fbl: false, sms: false, variety: "", label: "", labelEdited: false, createdAt: Date.now() };
}
function openCoinForm(id) {
  const existing = id ? getCoin(id) : null;
  draft = existing ? JSON.parse(JSON.stringify(existing)) : blankCoin();
  draft._isNew = !existing;
  draft._newAlbum = { brand: "Whitman", number: "" };
  renderCoinForm();
}
function sourceOptions() {
  return [...new Set([...SOURCE_DEFAULTS, ...allCoins().map((c) => (c.source || "").trim()).filter(Boolean)])];
}
function renderCoinForm() {
  const d = draft;
  const t = TYPE_BY_ID[d.typeId];
  const mints = t ? ["", ...t.mints.filter((m) => m !== "P"), "P"] : MINTS;
  const grades = d.gradeMode === "cert" ? CERT_GRADES : GRADES;
  const melt = meltEach(d);
  openSheet(`<div class="sheet-head"><h2>${d._isNew ? "Add coin" : "Edit coin"}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
  ${store.mode === "snapshot" ? `<div class="banner" style="margin:0 0 6px">Try it out. This copy doesn't save, so coins added here disappear when the page is closed.</div>` : ""}
  <form id="coinForm" autocomplete="off">
    ${sampleApi && d._isNew ? photoFillButton(d) : ""}
    <div class="f typeahead"><span>Start from a known coin</span>
      <input type="search" id="typeSearch" placeholder="Search Red Book types, e.g. Morgan" value="${esc(t ? t.name : "")}">
      <div class="ta-list" id="typeList" hidden></div>
    </div>
    ${t && t.note ? `<div class="hint">${esc(t.note)}</div>` : ""}
    <div class="grid2">
      <label class="f"><span>Year</span><input type="number" inputmode="numeric" data-f="year" value="${esc(d.year)}" placeholder="${t ? t.start + "–" + t.end : "1921"}"></label>
      <label class="f"><span>Mint mark</span><select data-f="mint">${mints.map((m) => `<option value="${m}" ${d.mint === m ? "selected" : ""}>${m || "None (Philadelphia)"}</option>`).join("")}</select></label>
    </div>
    <div class="grid2">
      <label class="f"><span>Coin type</span><input type="text" data-f="typeName" value="${esc(d.typeName)}" placeholder="Morgan Dollar"></label>
      <label class="f"><span>Denomination</span><input type="text" data-f="denom" value="${esc(d.denom)}" placeholder="$1"></label>
    </div>

    <fieldset><legend>Grade</legend>
      <div class="seg"><button type="button" data-act="gmode" data-v="raw" class="${d.gradeMode === "raw" ? "on" : ""}">Raw</button><button type="button" data-act="gmode" data-v="cert" class="${d.gradeMode === "cert" ? "on" : ""}">Certified</button></div>
      ${d.gradeMode === "cert" ? `<div class="grid2">
        <label class="f"><span>Grading service</span><select data-f="service" data-rerender>${SERVICES.map((s) => `<option ${d.service === s ? "selected" : ""}>${s}</option>`).join("")}</select></label>
        <label class="f"><span>Cert number</span><input type="text" inputmode="numeric" data-f="cert" value="${esc(d.cert)}"></label></div>
        ${d.service === "Other" ? `<label class="f"><span>Service name</span><input type="text" data-f="customService" value="${esc(d.customService)}"></label>` : ""}` : ""}
      <label class="f"><span>${d.gradeMode === "cert" ? "Grade on the holder" : "My estimated grade"}</span>
        <select data-f="grade" data-rerender><option value="">Choose…</option>${grades.map((g) => `<option ${d.grade === g ? "selected" : ""}>${g}</option>`).join("")}<option value="Other" ${d.grade === "Other" ? "selected" : ""}>Other…</option></select></label>
      ${d.grade === "Other" ? `<label class="f"><span>Custom grade</span><input type="text" data-f="customGrade" value="${esc(d.customGrade)}" placeholder="e.g. VF details, cleaned"></label>` : ""}
      ${isJunk(d) ? `<div class="hint">Junk coins are valued at melt.</div>` : ""}
      ${PRICE_BOOK.series[d.typeId] && PRICE_BOOK.series[d.typeId].fbl && !isProofGrade(d.grade) ? `<label class="switch"><span>Full Bell Lines (FBL)<div class="small muted">All the lines on the Liberty Bell are complete.</div></span><input type="checkbox" data-fcheck="fbl" ${d.fbl ? "checked" : ""}></label>` : ""}
      <div id="smsBox">${smsField(d)}</div>
      <div id="varietyBox">${varietyField(d)}</div>
    </fieldset>

    <div class="grid2">
      <label class="f"><span>Metal</span><select data-f="metal" data-rerender><option value="">Choose…</option>${METALS.map((m) => `<option ${d.metal === m ? "selected" : ""}>${m}</option>`).join("")}</select></label>
      <label class="f"><span>Metal content (oz)</span><input type="number" inputmode="decimal" step="0.00001" data-f="oz" value="${esc(d.oz)}" placeholder="0.77344"></label>
    </div>
    <div class="hint" id="meltHint">${melt != null ? "Melt today: " + money(melt) + " each" : meltKey(d) ? "Enter the spot price in Options to see melt." : ""}</div>

    <div class="grid3">
      <label class="f"><span>Quantity</span><input type="number" inputmode="numeric" min="1" data-f="qty" value="${esc(d.qty)}"></label>
      <label class="f"><span>Paid each</span><input type="number" inputmode="decimal" step="0.01" data-f="paid" value="${esc(d.paid)}" placeholder="$"></label>
      <label class="f"><span>Value each</span><input type="number" inputmode="decimal" step="0.01" data-f="value" value="${esc(isJunk(d) ? "" : d.value)}" placeholder="${isJunk(d) ? "melt" : "$"}" ${isJunk(d) ? "disabled" : ""}></label>
    </div>
    <div class="hint" id="bookHint">${esc(bookHintText(d))}</div>
    <div class="grid2">
      <label class="f"><span>Source</span><input type="text" list="sourceList" data-f="source" value="${esc(d.source)}" placeholder="Coin shop, Inherited…"></label>
      <label class="f"><span>Date acquired</span><input type="date" data-f="acquired" value="${esc(d.acquired)}"></label>
    </div>
    <datalist id="sourceList">${sourceOptions().map((s) => `<option value="${esc(s)}">`).join("")}</datalist>
    <div class="hint" id="inhHint" ${isInherited(d) ? "" : "hidden"}><span class="dns">Do not sell</span> Inherited coins are marked do-not-sell and aren't counted in gains.</div>

    <label class="f"><span>Album</span><select data-f="albumId" data-rerender><option value="">Not in an album</option>${albums().map((a) => `<option value="${esc(a.id)}" ${d.albumId === a.id ? "selected" : ""}>${esc(albumTitle(a))}</option>`).join("")}<option value="__new" ${d.albumId === "__new" ? "selected" : ""}>+ New album…</option></select></label>
    ${d.albumId === "__new" ? `<div class="grid2">
      <label class="f"><span>Brand</span><select data-na="brand">${ALBUM_BRANDS.map((b) => `<option ${d._newAlbum.brand === b ? "selected" : ""}>${b}</option>`).join("")}</select></label>
      <label class="f"><span>${d._newAlbum.brand === "Other" ? "Album name" : "Album number"}</span><input type="text" data-na="number" value="${esc(d._newAlbum.number)}" placeholder="${d._newAlbum.brand === "Dansco" ? "7070" : d._newAlbum.brand === "Whitman" ? "9128" : "My Morgans"}"></label></div>
      <div class="hint">Makes a virtual album for this coin type with every date and mint mark. Change the date range later on the Albums page.</div>` : ""}

    <label class="f"><span>Notes</span><textarea data-f="notes">${esc(d.notes)}</textarea></label>

    <details ${(d.photos || []).length ? "open" : ""}><summary>Photos (${(d.photos || []).length})</summary>
      <div class="photos">${(d.photos || []).map((p, i) => `<div class="ph"><img src="${esc(photoSrc(p))}" alt=""><button type="button" class="rm" data-act="rmPhoto" data-i="${i}" aria-label="Remove photo">✕</button></div>`).join("")}</div>
      <label class="btn file-btn" style="display:inline-block;margin-top:10px">Add photos<input type="file" accept="image/*" multiple id="photoInput"></label>
      <div class="hint" id="photoHint">${store.mode === "db" && !assetsApi ? "Photos can't be saved from this view." : ""}</div>
    </details>

    <label class="f"><span>Label</span><input type="text" id="labelInput" data-f="label" value="${esc(d.labelEdited ? d.label : autoLabel(d))}"></label>
    <div class="hint">Fills in as date-mint mark, coin type, denomination. Type over it to use your own.${d.labelEdited ? ` <button type="button" class="link-btn" data-act="resetLabel">Use automatic label</button>` : ""}</div>

    <div class="btn-row">
      <button type="submit" class="btn primary">${d._isNew ? "Add coin" : "Save changes"}</button>
      <button type="button" class="btn" data-act="closeSheet">Cancel</button>
    </div>
  </form>`);
  refreshFormHints();
}

function smsField(d) {
  if (!hasSms(d) || isProofGrade(d.grade)) return "";
  return `<label class="switch"><span>Special Mint Set (SMS)<div class="small muted">From a 1964–1967 Special Mint Set, not a regular strike.</div></span><input type="checkbox" data-fcheck="sms" ${d.sms ? "checked" : ""}></label>`;
}
function varietyField(d) {
  const vs = bookVarieties(d);
  if (!vs.some((v) => v)) return "";
  return `<label class="f"><span>Variety</span><select data-f="variety">${vs.map((v) => `<option value="${esc(v)}" ${d.variety === v ? "selected" : ""}>${esc(v || "Regular")}</option>`).join("")}</select></label>`;
}
function bookHintText(d) {
  if (isJunk(d)) return "";
  const b = bookLookup(d);
  if (!b) return "";
  const t = bookText(b);
  return b.price != null ? t + (num(d.value) == null ? ". Used as the value while Value each is empty." : "") : t;
}
function refreshFormHints() {
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
    if (vs.length && !vs.includes(draft.variety || "")) draft.variety = vs[0];
    if (!vs.some((v) => v)) draft.variety = "";
    const html = varietyField(draft);
    if (vb.innerHTML !== html) vb.innerHTML = html;
  }
  const h = $("#bookHint");
  if (h) h.textContent = bookHintText(draft);
  const vi = $("[data-f=value]");
  if (vi && !isJunk(draft)) { const bp = bookPrice(draft); vi.placeholder = bp != null ? bp.toFixed(2) : "$"; }
}

function pickType(id) {
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
  renderCoinForm();
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
  delete c._isNew; delete c._newAlbum; delete c._fillBlobs; // photo-fill working copies aren't saved
  c.year = num(c.year) ?? "";
  c.qty = Math.max(1, num(c.qty) || 1);
  if (!c.typeName && !c.year && !c.label) { toast("Add at least a year or a coin type."); return; }
  if (!c.family) c.family = c.typeName || "Other";
  if (!c.labelEdited) c.label = autoLabel(c);
  if (c.albumId === "__new") {
    const na = d._newAlbum;
    const t = TYPE_BY_ID[c.typeId];
    const match = albums().find((a) => a.brand === na.brand && (a.number || "") === na.number.trim() && a.typeId === c.typeId);
    if (match) c.albumId = match.id;
    else {
      const a = { kind: "album", id: uid(), brand: na.brand, number: na.number.trim(), name: na.brand === "Other" ? na.number.trim() : "", typeId: c.typeId,
        start: t ? t.start : num(c.year) || 1900, end: t ? t.end : num(c.year) || 1900, removed: [], createdAt: Date.now() };
      a.slots = t ? buildSlots(t.id, a.start, a.end) : [{ y: num(c.year), m: normMint(c.mint) }];
      put("a_" + a.id, a);
      c.albumId = a.id;
    }
  }
  const isNew = d._isNew;
  if (c.typeId) touchType(c.typeId);
  closeSheet();
  await saveCoin(c);
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
async function addPhotos(files) {
  const hint = $("#photoHint");
  for (const f of files) {
    if (hint) hint.textContent = "Uploading photo…";
    const blob = await shrinkImage(f);
    if (store.mode === "db") {
      if (!assetsApi) { toast("Photos can't be saved from this view."); break; }
      try {
        const a = await assetsApi.upload(blob);
        draft && draft.photos.push({ id: a.id });
      } catch (e) { toast("Couldn't upload that photo."); }
    } else if (draft) {
      draft.photos.push({ url: URL.createObjectURL(blob) });
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
    saveCoin({ ...c, qty: q - n });
    // Remember which coin it was split from, so moving it back puts it back exactly.
    saveCoin({ ...c, id: uid(), qty: n, status: "sold", sold, splitFrom: c.id });
  } else {
    saveCoin({ ...c, status: "sold", sold });
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
    <label class="f"><span>Name (optional)</span><input type="text" name="name" placeholder="Grandpa's Morgans"></label>
    <label class="f"><span>Coin type</span><select name="typeId" id="albumType">${typeOptions()}</select></label>
    <div class="grid2">
      <label class="f"><span>From year</span><input type="number" name="start" id="albumStart" value="${firstAlbumType().start}"></label>
      <label class="f"><span>To year</span><input type="number" name="end" id="albumEnd" value="${firstAlbumType().end}"></label>
    </div>
    <div class="hint">Every year and mint mark in the range gets a slot.</div>
    <div class="btn-row"><button class="btn primary" type="submit">Create album</button><button class="btn" type="button" data-act="closeSheet">Cancel</button></div>
  </form>`);
}
function typeOptions() {
  const { recent, rest } = typesRecentFirst(COIN_TYPES);
  const opt = (t) => `<option value="${t.id}">${esc(t.name)} (${t.start}–${t.end})</option>`;
  return recent.length ? `<optgroup label="Recent">${recent.map(opt).join("")}</optgroup><optgroup label="All types">${rest.map(opt).join("")}</optgroup>` : rest.map(opt).join("");
}
const firstAlbumType = () => TYPE_BY_ID[recentTypeIds()[0]] || COIN_TYPES[0];
function doNewAlbum(form) {
  const fd = new FormData(form);
  const t = TYPE_BY_ID[fd.get("typeId")];
  let start = num(fd.get("start")) ?? t.start, end = num(fd.get("end")) ?? t.end;
  if (start > end) [start, end] = [end, start];
  const a = { kind: "album", id: uid(), brand: fd.get("brand"), number: (fd.get("number") || "").trim(), name: (fd.get("name") || "").trim(), typeId: t.id, start, end, removed: [], createdAt: Date.now() };
  a.slots = buildSlots(t.id, start, end);
  put("a_" + a.id, a);
  touchType(t.id);
  closeSheet();
  go("album-" + a.id);
}
function openMissing(id) {
  const a = getAlbum(id);
  const st = albumStats(a);
  const missing = st.slots.filter((s) => !st.filled.has(s.y + "|" + s.m));
  const t = TYPE_BY_ID[a.typeId];
  openSheet(`<div class="sheet-head"><h2>Missing (${missing.length})</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    ${missing.length ? `<div class="card">${missing.map((s) => {
      const fake = { year: s.y, mint: s.m, typeName: t ? shortName(t) : "", denom: t ? t.denom : "", gradeMode: "raw" };
      return `<div class="rowline"><span>${esc(s.y + (s.m ? "-" + s.m : ""))}</span><a class="small" href="${esc(ebayUrl(fake))}" target="_blank" rel="noopener">eBay sold ↗</a></div>`;
    }).join("")}</div>` : `<div class="card empty">Nothing missing. Album complete <span class="check">✓</span></div>`}`);
}

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
  fam: (el) => { listState.family = el.dataset.v || null; render(); },
  dir: () => { listState.dir = listState.dir === "asc" ? "desc" : "asc"; render(); },
  edit: (el) => openCoinForm(el.dataset.id),
  sell: (el) => openSell(el.dataset.id),
  editSale: (el) => openSell(el.dataset.id, true),
  unsell: (el) => {
    const c = getCoin(el.dataset.id);
    if (!c) return;
    const orig = c.splitFrom ? getCoin(c.splitFrom) : null;
    if (orig && orig.status === "owned") {
      // Part of a lot was sold: add the coins back to the original entry.
      saveCoin({ ...orig, qty: qtyOf(orig) + qtyOf(c) });
      remove("c_" + c.id);
      toast("Back in your collection.");
      go("coin-" + orig.id);
      return;
    }
    const n = { ...c, status: "owned" };
    delete n.sold;
    delete n.splitFrom;
    saveCoin(n);
    toast("Back in your collection.");
  },
  delete: (el) => {
    const c = getCoin(el.dataset.id);
    if (!c) return;
    const prevStatus = c.status;
    saveCoin({ ...c, status: "deleted", prevStatus, deletedAt: Date.now() });
    go("coins");
    toast("Coin deleted.", { label: "Undo", fn: () => { const x = getCoin(c.id); if (x) { saveCoin({ ...x, status: prevStatus }); toast("Restored."); } } });
  },
  restore: (el) => { const c = getCoin(el.dataset.id); if (c) { saveCoin({ ...c, status: c.prevStatus || "owned" }); toast("Restored."); } },
  purge: (el) => { remove("c_" + el.dataset.id); toast("Deleted forever."); },
  toastAction: () => { const t = $("#toast"); t.hidden = true; if (t._action) t._action(); },
  hideSpot: (el) => { const s = settings(); saveSettings({ hideSpot: { ...s.hideSpot, [el.dataset.v]: !el.checked } }); },
  showSold: (el) => saveSettings({ showSold: el.checked, soldAutoDone: true }),
  newAlbum: openNewAlbum,
  missing: (el) => openMissing(el.dataset.id),
  editSlots: (el) => { albumEdit.id = albumEdit.id === el.dataset.id ? null : el.dataset.id; render(); },
  toggleSlot: (el) => {
    const a = getAlbum(el.dataset.id);
    const k = el.dataset.k;
    const removed = new Set(a.removed || []);
    removed.has(k) ? removed.delete(k) : removed.add(k);
    put("a_" + a.id, { ...a, removed: [...removed] });
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
  gmode: (el) => { draft.gradeMode = el.dataset.v; if (draft.gradeMode === "cert" && draft.grade === "Junk") draft.grade = ""; renderCoinForm(); },
  pickType: (el) => pickType(el.dataset.id),
  rmPhoto: (el) => { draft.photos.splice(+el.dataset.i, 1); renderCoinForm(); },
  resetLabel: () => { draft.labelEdited = false; draft.label = ""; renderCoinForm(); },
};

document.addEventListener("click", (e) => {
  const goEl = e.target.closest("[data-go]");
  if (goEl) { e.preventDefault(); go(goEl.dataset.go); return; }
  const actEl = e.target.closest("[data-act]");
  if (actEl && actions[actEl.dataset.act]) {
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
  if (el.dataset.list === "q") { listState.q = el.value; render(); return; }
  if (el.dataset.setting) {
    clearTimeout(spotTimer);
    spotTimer = setTimeout(() => saveSettings({ [el.dataset.setting]: el.value.trim() }), 700);
    return;
  }
  if (el.dataset.spot) {
    clearTimeout(spotTimer);
    spotTimer = setTimeout(() => {
      const spot = {};
      $$("[data-spot]").forEach((i) => { spot[i.dataset.spot] = num(i.value); });
      saveSettings({ spot, spotUpdated: today() });
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
  if (f === "typeName") { draft.family = ""; if (TYPE_BY_ID[draft.typeId] && shortName(TYPE_BY_ID[draft.typeId]) !== el.value) draft.typeId = ""; }
  if (!draft.labelEdited) { const li = $("#labelInput"); if (li) li.value = autoLabel(draft); }
  if (f === "oz") { const h = $("#meltHint"); const m = meltEach(draft); if (h) h.textContent = m != null ? "Melt today: " + money(m) + " each" : ""; }
  refreshFormHints();
});
document.addEventListener("focusin", (e) => { if (e.target.id === "typeSearch") showTypeList(e.target.value); });
document.addEventListener("change", (e) => {
  const el = e.target;
  if (el.dataset.list) { listState[el.dataset.list] = el.value; render(); return; }
  if (el.id === "photoInput") { addPhotos([...el.files]); return; }
  if (el.id === "albumType") {
    const t = TYPE_BY_ID[el.value];
    $("#albumStart").value = t.start; $("#albumEnd").value = t.end;
    return;
  }
  if (!draft) return;
  if (el.dataset.na) { draft._newAlbum[el.dataset.na] = el.value; if (el.dataset.na === "brand") renderCoinForm(); return; }
  if (el.dataset.fcheck) { draft[el.dataset.fcheck] = el.checked; refreshFormHints(); return; }
  if (el.dataset.f) {
    draft[el.dataset.f] = el.value;
    if (el.dataset.f === "metal" && !MELT_OF_METAL[el.value]) draft.oz = "";
    if (el.hasAttribute("data-rerender")) {
      const y = $(".sheet").scrollTop;
      renderCoinForm();
      $(".sheet").scrollTop = y;
    }
  }
});
document.addEventListener("submit", (e) => {
  e.preventDefault();
  if (e.target.id === "coinForm") saveDraft();
  else if (e.target.id === "sellForm") doSell(e.target);
  else if (e.target.id === "albumForm") doNewAlbum(e.target);
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeSheet(); closeMenu(); } });

// Start once every script (sheets.js, photofill.js) has loaded.
document.addEventListener("DOMContentLoaded", () => { render(); initStore(); });
