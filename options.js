// Photo guide page, Options page, live metal prices, pop-up sheet (split from app.js; plain script, shares the page's global names)
/* --- Photo guide --- */
function viewGuide() {
  return `<h1>PCGS Photograde</h1>
    <div class="card">PCGS Photograde shows photos of each coin type at every grade, so you can compare your coin side by side.
      <div class="btn-row"><a class="btn primary" style="text-align:center;text-decoration:none" href="https://www.pcgs.com/photograde" target="_blank" rel="noopener">Open PCGS Photograde ↗</a></div>
      <div class="hint">Opens in your browser.</div></div>
    <h2>Grades at a glance</h2>
    <div class="card">${GRADE_GUIDE.map(([g, d]) => `<div class="rowline" style="display:block"><b>${esc(g)}</b><div class="small muted">${esc(d)}</div></div>`).join("")}</div>`;
}

/* --- Options --- */
// Live metal prices from a free source (gold-api.com, no account). Asked for each metal; any it can't give stay as typed.
const SPOT_SYMBOLS = { gold: "XAU", silver: "XAG", platinum: "XPT", copper: "HG" };
let spotFailed = false; // the last automatic or button fetch got nothing (shown on Home; not saved)
async function fetchSpotPrices(auto) {
  if (store.mode === "snapshot" || store.mode === "memory" || store.mode === "demo") return;
  if (auto && (navigator.onLine === false || !/^https?:/.test(location.protocol))) return; // not when opened as a plain file
  const btn = $("#spotFetch"); if (btn) { btn.disabled = true; btn.textContent = "Getting prices…"; }
  const got = {};
  await Promise.all(SPOT_METALS.map(async (m) => {
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
      const r = await fetch("https://api.gold-api.com/price/" + SPOT_SYMBOLS[m.key], { signal: ctl.signal });
      clearTimeout(t);
      const j = await r.json(); const v = num(j && j.price);
      if (r.ok && v != null && v > 0) got[m.key] = Math.round(v * 100) / 100;
    } catch (e) { /* offline or blocked: keep the old price */ }
  }));
  const n = Object.keys(got).length;
  spotFailed = n === 0;
  if (n) {
    const stamp = new Date().toISOString();
    saveSettings({ spot: { ...settings().spot, ...got }, spotUpdated: stamp }, true);
    $$("[data-spot]").forEach((i) => { if (got[i.dataset.spot] != null) i.value = got[i.dataset.spot]; });
    const u = $("#spotStamp"); if (u) u.textContent = "Last updated " + stampText(stamp) + ".";
    if (!draft && typeof render === "function" && !$(".sheet")) render();
  }
  if (btn) { btn.disabled = false; btn.textContent = "Get live prices"; }
  if (!n && typeof render === "function" && !draft && !$(".sheet")) render(); // show the "couldn't get prices" line
  if (!auto) toast(n === SPOT_METALS.length ? "Prices updated." : n ? "Some prices updated. The rest stay as you typed them." : "Couldn't get prices. Check your connection, or type them in.");
}
// One line on Home (and in the Insurance Report pop-up) saying how fresh the metal prices are.
// Three states: fresh, old (over a day), and failed or none. The warning below it appears whenever a metal has no price.
function priceStatusLine(inSheet) {
  if (store.mode === "snapshot") return "";
  const s = settings(), typeIn = inSheet ? `data-act="typeInPrices"` : `data-go="options" data-open="spot-prices"`;
  const anyPrice = SPOT_METALS.some((m) => num(s.spot[m.key]) != null);
  const age = s.spotUpdated ? Date.now() - new Date(s.spotUpdated).getTime() : NaN;
  const days = Math.floor(age / 86400000);
  const btn = (label, extra) => `<button class="sh-getp" ${extra}>${label}</button>`;
  let line;
  if (!anyPrice || spotFailed && !(age < 3600000)) {
    line = `<span class="sh-upd warn">Couldn't get live prices (no internet?)</span>${btn("Type them in", typeIn)}${btn("Try again", 'id="spotFetch" data-act="fetchSpot"')}`;
  } else if (days >= 1) {
    line = `<span class="sh-upd warn">Prices are ${days} day${days > 1 ? "s" : ""} old</span>${btn("Refresh", 'id="spotFetch" data-act="fetchSpot"')}`;
  } else {
    line = `<span class="sh-upd">${s.spotUpdated ? "Prices updated " + esc(stampText(s.spotUpdated)) : "Prices"}</span>${btn("↻ Refresh", 'id="spotFetch" data-act="fetchSpot" aria-label="Refresh prices"')}`;
  }
  return `<div class="sh-updrow">${line}</div>`;
}
// "Totals are low" note when an owned coin's metal has no price. Also used in the report pop-up.
function lowTotalNote(inSheet) {
  const miss = metalsMissingPrice();
  if (!miss.length || store.mode === "snapshot") return "";
  return `<div class="lowtot">Totals are low: add a ${esc(metalWords(miss))} price. <button class="link-btn" ${inSheet ? 'data-act="typeInPrices"' : 'data-go="options" data-open="spot-prices"'}>Type it in</button></div>`;
}
// When the first coin of a metal is saved and that metal has no price: ask once. Works offline (type it in).
function askMetalPrice(c) {
  const k = meltKey(c), s = settings();
  if (!k || !ozEach(c) || spotPerOz(k) != null || (s.priceAsked || {})[k]) return;
  if (["snapshot", "memory", "demo"].includes(store.mode)) return;
  const m = SPOT_METALS.find((x) => x.key === k); if (!m) return;
  saveSettings({ priceAsked: { ...(s.priceAsked || {}), [k]: true } }, true);
  openSheet(`<div class="sheet-head"><h2>${esc(m.label)} price needed</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <p>To work out what this coin's ${esc(m.label.toLowerCase())} is worth, the app needs today's ${esc(m.label.toLowerCase())} price. Until then it shows the coin at face value.</p>
    <div class="btn-row"><button class="btn primary" data-act="ppFetch" data-v="${k}">Get live prices</button></div>
    <label class="f"><span>Or type it in ($ per ${esc(m.unit)})</span><input type="number" inputmode="decimal" step="0.01" min="0" id="ppInput" placeholder="0.00"></label>
    <div class="btn-row"><button class="btn" data-act="ppSave" data-v="${k}">Save this price</button><button class="btn" data-act="closeSheet">Later</button></div>
    <div class="hint">No internet? Typing it works fine. You can change prices any time in Options.</div>`);
}
// The value-book section: what's saved on this phone, the table list and the edition box. Lives at the bottom of Coin Value.
// The words "Red Book" come from the saved price record (bookName), so another value source needs no rewording.
function bookStatusLine() {
  const n = Object.keys(PRICE_BOOK.series || {}).length, name = bookName(), rec = store.docs.get("pricebook");
  if (store.mode === "snapshot") return name + " values in this file were worked out when it was made.";
  if (!n) return "No " + name + " prices on this phone.";
  const head = [PRICE_BOOK.edition, n + " series"].filter(Boolean).join(" · ");
  if (!rec || (store.mode !== "local" && store.mode !== "db")) return name + " prices in this window (not saved): " + head;
  const d = rec.savedAt ? new Date(rec.savedAt) : null;
  return name + " prices on this phone: " + head + (d && !isNaN(d) ? " · saved " + d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");
}
function redBookHtml() {
  const s = settings(), name = esc(bookName());
  return `<h2>${name} values</h2>
    <div class="card"><div class="small" id="bookStatus" style="margin-bottom:8px"><b>${esc(bookStatusLine())}</b></div>${Object.keys(PRICE_BOOK.series).map((id) => `<div class="rowline"><span>${esc(TYPE_BY_ID[id] ? TYPE_BY_ID[id].name : id)}</span><span class="muted small">${Object.keys(PRICE_BOOK.series[id]).map((k) => ({ circ: "regular", fbl: "FBL", proof: "proof", sms: "SMS" }[k] || k)).join(" · ")}</span></div>`).join("")}
      <label class="f"><span>${name} edition</span><input type="text" data-setting="bookEdition" value="${esc(s.bookEdition || PRICE_BOOK.edition || "")}" placeholder="e.g. 2026"></label>
      <div class="hint">A coin with no value typed in uses its ${name} ${wi("redbook")} value. Coins below the lowest listed grade use melt.</div></div>`;
}
// Options: every section folds shut (closed by default, remembered). Splits the page at each heading.
// Options sections sit under five group headings (Seller Mode keeps its own). Each section still folds on its own.
const OPT_GROUPS = [
  ["Prices and values", ["spot-prices", "selling", "photo-fill"]],
  ["Look of Home", ["shelf-style", "home-shelf", "show-on-home"]],
  ["Adding coins", ["adding-coins", "coin-id-style", "inheritances"]],
  ["Your data", ["spreadsheet", "backup-and-restore", "share-a-snapshot", "insurance-report", "recently-deleted"]],
  ["Share and help", ["share-coin-cabinet", "try-the-demo", "guided-first-coin", "whats-new", "report-a-problem"]],
  ["Seller Mode", ["seller-mode"]],
];
function viewOptions() {
  const open = settings().optOpen || {};
  const parts = optionsHtml().split(/(?=<h2[ >])/);
  const head = parts.shift(); // the "Options" title
  const tail = parts[parts.length - 1], cut = tail.indexOf('<p class="small muted">Coin Cabinet version');
  let foot = "";
  if (cut > 0) { foot = tail.slice(cut); parts[parts.length - 1] = tail.slice(0, cut); }
  const secs = parts.map((p) => {
    const m = p.match(/^<h2[^>]*>([\s\S]*?)<\/h2>/);
    if (!m) return { key: "", html: p };
    const title = m[1], key = title.replace(/<[^>]*>/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const on = !!open[key];
    return { key, html: `<h2 class="fold"><button class="fold-btn" data-act="optSec" data-v="${key}" aria-expanded="${on}"><span>${title}</span><i aria-hidden="true">${on ? "▾" : "▸"}</i></button></h2>${on ? p.slice(m[0].length) : ""}` };
  });
  const used = new Set();
  const grouped = OPT_GROUPS.map(([name, keys]) => {
    const mine = secs.filter((x) => !used.has(x) && keys.some((k) => x.key === k || x.key.startsWith(k + "-")));
    mine.forEach((x) => used.add(x));
    return mine.length ? (name === "Seller Mode" ? "" : `<h3 class="optgroup">${name}</h3>`) + mine.map((x) => x.html).join("") : "";
  }).join("");
  return head + grouped + secs.filter((x) => !used.has(x)).map((x) => x.html).join("") + foot;
}
function optionsHtml() {
  const s = settings();
  const del = deletedCoins().sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
  return `<h1>Options</h1>
    ${typeof levelOptionsHtml === "function" ? levelOptionsHtml() : ""}
    <h2>Spot prices</h2>
    <div class="card"><div class="small muted">Spot price ${wi("spot")}: what a metal is trading for today.</div>
      ${SPOT_METALS.map((m) => `<label class="f"><span>${m.label} ($ per ${m.unit})</span><input type="number" inputmode="decimal" step="0.01" min="0" data-spot="${m.key}" value="${esc(s.spot[m.key] ?? "")}" placeholder="0.00"></label>`).join("")}
      <div class="btn-row"><button class="btn" id="spotFetch" data-act="fetchSpot">Get live prices</button></div>
      <div class="hint">Filled in for you when the app opens, or tap the button. You can also type prices. <span id="spotStamp">${s.spotUpdated ? "Last updated " + esc(stampText(s.spotUpdated)) + "." : ""}</span> <a href="https://www.kitco.com/" target="_blank" rel="noopener">Look up current prices ↗</a></div>
    </div>
    <h2>Shelf style</h2>
    <div class="card"><div class="chips">${(typeof SHELF_STYLES !== "undefined" ? SHELF_STYLES : []).map(([k, n]) => { const on = shelfStyle() === k; return `<button class="chip ${on ? "on" : ""}" data-act="shelfStyle" data-v="${k}" aria-pressed="${on}">${on ? "✓ " : ""}${n}</button>`; }).join("")}</div>
      <div class="hint">Bookcase: wood shelves; at night only the page around it goes dark. Safe: steel walls, dark all the time.</div></div>
    <h2>Home shelf</h2>
    <div class="card">${typeof shelfOptionsHtml === "function" ? shelfOptionsHtml() : ""}</div>
    ${typeof sellerOptionsHtml === "function" && levelAtLeast("everything") ? sellerOptionsHtml() : ""}
    ${typeof sellingOptionsHtml === "function" ? sellingOptionsHtml() : ""}
    ${!sampleApi && typeof photoFillOptionsHtml === "function" ? photoFillOptionsHtml() : ""}
    <h2>Show on Home</h2>
    <div class="card">
      ${SPOT_METALS.map((m) => `<label class="switch"><span>${m.label} spot price</span><input type="checkbox" data-act="hideSpot" data-v="${m.key}" ${s.hideSpot[m.key] ? "" : "checked"}></label>`).join("")}
      <label class="switch"><span>Sold results<div class="small muted">Turns on by itself at your first sale.</div></span><input type="checkbox" data-act="showSold" ${s.showSold ? "checked" : ""}></label>
      <label class="switch"><span>Melt value by metal</span><input type="checkbox" data-act="homeTog" data-v="showMeltSec" ${s.showMeltSec !== false ? "checked" : ""}></label>
      <label class="switch"><span>Value over time</span><input type="checkbox" data-act="homeTog" data-v="showHistory" ${s.showHistory !== false ? "checked" : ""}></label>
      <label class="switch"><span>Recently added</span><input type="checkbox" data-act="homeTog" data-v="showAdded" ${s.showAdded !== false ? "checked" : ""}></label>
      <label class="switch"><span>Recently sold</span><input type="checkbox" data-act="homeTog" data-v="showSoldList" ${s.showSoldList !== false ? "checked" : ""}></label>
    </div>
    ${typeof inhOptionsHtml === "function" ? inhOptionsHtml() : ""}
    <h2>Adding coins</h2>
    <div class="card">
      <label class="switch"><span>Junk silver goes in My Silver Stack<div class="small muted">For new junk silver coins. Coins you already saved don't change.</div></span><input type="checkbox" data-act="homeTog" data-v="junkStack" ${s.junkStack !== false ? "checked" : ""}></label>
      <label class="switch"><span>Don't ask before putting a coin up for sale</span><input type="checkbox" data-act="homeTog" data-v="skipForSaleAsk" ${s.skipForSaleAsk ? "checked" : ""}></label>
    </div>
    ${store.mode === "snapshot" || typeof idStyleOptionsHtml !== "function" ? "" : idStyleOptionsHtml()}
    ${store.mode === "demo" ? "" : `    <h2>Spreadsheet</h2>
    <div class="card">Save all your coins as a spreadsheet file (CSV), or add coins from one.
      <div class="btn-row"><button class="btn" data-act="export">Export CSV</button><button class="btn" data-act="openImport">Import CSV</button></div>
      ${s.lastImport && s.lastImport.ids ? `<div class="hint" style="margin-top:8px">Last import: ${s.lastImport.count} row${s.lastImport.count === 1 ? "" : "s"} on ${esc(s.lastImport.at)}. <button class="link-btn" data-act="undoImport">Remove them</button></div>` : ""}</div>
    <h2>Backup and restore</h2>
    <div class="card">${store.mode === "db" ? "Save everything, photos included, in one file. This is also how you move your coins into the Coin Cabinet app on your phone." : "Save everything, photos included, in one file, or bring coins in from a backup."}
      ${settings().lastBackup ? `<div class="small muted" style="margin-top:6px">Last backup: ${esc(settings().lastBackup)}</div>` : ""}
      <div class="btn-row"><button class="btn" data-act="openBackup">Backup and restore</button></div></div>
`}
    <h2>Share Coin Cabinet</h2>
    <div class="card">Send someone the link so they can install Coin Cabinet. They get their own, separate collection: they can't see your coins, and you can't see theirs.
      <div class="btn-row"><button class="btn" data-act="shareApp">Share the app</button></div></div>
    ${store.mode === "demo" ? "" : `<h2>Try the demo</h2>
    <div class="card">Look around a made-up sample collection (about 120 coins, rolls, bars, albums and a coin show). It is kept apart from your real coins, and nothing you do there is saved.
      <div class="btn-row"><button class="btn" data-act="tryDemo">Try the demo</button></div></div>`}
    <h2>Guided first coin</h2>
    <div class="card">A one-minute walk-through of adding a coin, with small tips over the real form. Nothing is saved unless you save the coin.
      <div class="btn-row"><button class="btn" data-act="guideStart">Show me how</button></div></div>
    <h2>Share a snapshot</h2>
    <div class="card">Save a view-only copy of your collection as one file to send to friends. What you paid, sources, notes and buyers are left out unless you choose to include them. ${wi("snapshot")}
      <div class="btn-row"><button class="btn" data-act="openSnapshot">Share a snapshot</button></div></div>
    <h2>Insurance report</h2>
    <div class="card">A dated, itemized list of every coin you own with values and totals, ready to print or save as a PDF for your insurance agent.
      <div class="btn-row"><button class="btn" data-act="openReport">Create insurance report</button></div></div>
    <h2>What's new</h2>
    <div class="card">See what changed in the latest updates.
      <div class="btn-row"><button class="btn" data-act="whatsNew">What's new</button></div></div>
    <h2>Report a problem · Suggest an idea</h2>
    <div class="card">Something wrong or confusing, or an idea for the app? Either button opens a note on GitHub with your app version already filled in. Don't put anything private in it, because the page is public.
      <div class="btn-row"><button class="btn" data-act="reportProblem">Report a problem</button><button class="btn" data-act="suggestIdea">Suggest an idea</button></div></div>
    <h2>Recently deleted</h2>
    ${del.length ? `<div class="list">${del.map((c) => `<div class="coin-row">${thumbHtml(c)}<span class="coin-main"><span class="coin-label">${esc(labelOf(c))}</span><span class="coin-sub">${esc(gradeText(c))}</span></span>
      <button class="btn" data-act="restore" data-id="${esc(c.id)}">Restore</button><button class="btn danger" data-act="purge" data-id="${esc(c.id)}" aria-label="Delete forever">✕</button></div>`).join("")}</div>` : `<div class="card empty">Nothing deleted.</div>`}
    <p class="small muted">Coin Cabinet version ${APP_VERSION}</p>
    <p class="small muted">${store.mode === "db" ? "Your coins are saved to your Claude account and are private to you." : store.mode === "local" ? "Your coins are saved on this device only, and are private to you. Save a backup now and then, in case the device is lost or reset." : "Practice mode: nothing is saved."}</p>`;
}

/* ---------- sheets (pop-ups) ---------- */
// Back button: an open pop-up owns one history entry (more for a pop-up opened over another), so Back closes
// only the top pop-up and never leaves the page. Closing any other way removes those entries again.
let sheetMarks = 0, sheetLayers = [], sheetPopping = false, sheetPushAfter = false;
function sheetMark() { try { history.pushState({ sheet: 1, d: sheetMarks + 1 }, "", location.href); sheetMarks++; sheetOnMark = true; } catch (e) { /* no history: skip */ } }
// A pop-up that closed by itself leaves its history entries behind (going back there now would race with page changes).
// They are marked "left over", and Back skips over them, so no Back press is ever wasted.
let sheetLastHref = location.href, sheetSkipping = false;
let sheetOnMark = !!(history.state && (history.state.sheet || history.state.stale));
function sheetUnmark() {
  if (!sheetMarks) return;
  sheetMarks = 0;
  try { history.replaceState({ stale: 1 }, "", location.href); sheetOnMark = true; } catch (e) { /* skip */ }
}
let sheetPopCb = null;
function openSheet(html, cls) {
  const w = $("#sheet"), fresh = w.hidden;
  w.innerHTML = `<div class="sheet ${cls || ""}" role="dialog" aria-modal="true">${html}</div>`;
  w.hidden = false;
  document.body.style.overflow = "hidden";
  if (fresh) { if (sheetPopping) sheetPushAfter = true; else sheetMark(); }
}
// A small pop-up (like the ⓘ help) over a form: the form stays where it is (dimmed, typing untouched) and the small pop-up sits on top of it.
function topSheet() { let t = $("#sheetTop"); if (!t) { t = document.createElement("div"); t.id = "sheetTop"; t.className = "sheet-wrap"; t.style.zIndex = 41; t.hidden = true; document.body.appendChild(t); } return t; }
function hideTopSheet() { const t = $("#sheetTop"); if (t) { t.hidden = true; t.innerHTML = ""; } }
function openSheetOver(html, cls) {
  const w = $("#sheet"), t = topSheet(), covering = !w.hidden && w.querySelector(".sheet");
  if (!covering) { openSheet(html, cls); return; }
  if (t.hidden) { sheetLayers.push({ over: 1 }); sheetMark(); } // one history entry per pop-up on top
  t.innerHTML = `<div class="sheet ${cls || ""}" role="dialog" aria-modal="true">${html}</div>`;
  t.hidden = false;
}
function sheetLayerBack() { // true if it took the small pop-up off the form
  const l = sheetLayers.pop(); if (!l) return false;
  hideTopSheet();
  return true;
}
// A very quick second tap on ✕ lands on the page behind once the pop-up is gone: swallow real taps for a moment after a pop-up closes.
let sheetClosedAt = 0;
document.addEventListener("click", (e) => { if (e.isTrusted && Date.now() - sheetClosedAt < 350 && !e.target.closest("#sheet, #sheetTop")) { e.preventDefault(); e.stopPropagation(); } }, true);
function closeSheet() {
  sheetClosedAt = Date.now();
  const w = $("#sheet");
  w.hidden = true;
  w.innerHTML = "";
  document.body.style.overflow = "";
  draft = null;
  sheetLayers = []; hideTopSheet();
  if (typeof clearStash === "function") clearStash();
  sheetUnmark();
}
window.addEventListener("popstate", () => {
  const was = sheetOnMark, now = !!(history.state && (history.state.sheet || history.state.stale)), same = location.href === sheetLastHref;
  const justSkipped = sheetSkipping; sheetSkipping = false;
 
  sheetOnMark = now; sheetLastHref = location.href; // (a page change by link also fires popstate: told apart by the changed address)
  if (sheetPopping) { // our own history step finished
    sheetPopping = false; const cb = sheetPopCb; sheetPopCb = null;
    if (sheetPushAfter) { sheetPushAfter = false; if (!$("#sheet").hidden) sheetMark(); }
    if (cb) cb(); return;
  }
  if (sheetMarks && justSkipped) return; // our own step back over a Forward press: done
  if (sheetMarks && history.state && history.state.sheet && history.state.d >= sheetMarks) { sheetSkipping = true; history.back(); return; } // Forward onto a pop-up entry that was already closed by Back: stay put, keep the form and its typing
  if (sheetMarks) { // the person pressed Back with a pop-up open: close only the top pop-up
    sheetMarks--;
    if (!sheetLayerBack()) { const w = $("#sheet"); w.hidden = true; w.innerHTML = ""; document.body.style.overflow = ""; draft = null; sheetLayers = []; hideTopSheet(); if (typeof clearStash === "function") clearStash(); sheetMarks = 0; }
    return;
  }
  if (now || (was && same && !justSkipped)) { sheetSkipping = true; history.back(); } // landed on, or just left, a left-over pop-up entry: it is the same page, so step over it
});
window.addEventListener("hashchange", () => { sheetLastHref = location.href; sheetOnMark = !!(history.state && (history.state.sheet || history.state.stale)); });
// Escape or tapping outside: some pop-ups (like New want list) go back instead of closing.
function dismissSheet() { if (sheetLayers.length) { actions.wordBack(); return; } if (typeof sheetDismiss === "function" && sheetDismiss()) return; closeSheet(); }
$("#sheet").addEventListener("click", (e) => { if (e.target.id === "sheet") dismissSheet(); });
document.addEventListener("click", (e) => { if (e.target.id === "sheetTop") dismissSheet(); });

