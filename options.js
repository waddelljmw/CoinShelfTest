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
async function fetchSpotPrices(auto) {
  if (store.mode === "snapshot" || store.mode === "memory") return;
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
  if (n) {
    const stamp = new Date().toISOString();
    saveSettings({ spot: { ...settings().spot, ...got }, spotUpdated: stamp }, true);
    $$("[data-spot]").forEach((i) => { if (got[i.dataset.spot] != null) i.value = got[i.dataset.spot]; });
    const u = $("#spotStamp"); if (u) u.textContent = "Last updated " + stampText(stamp) + ".";
    if (!draft && typeof render === "function" && !$(".sheet")) render();
  }
  if (btn) { btn.disabled = false; btn.textContent = "Get live prices"; }
  if (!auto) toast(n === SPOT_METALS.length ? "Prices updated." : n ? "Some prices updated. The rest stay as you typed them." : "Couldn't get prices. Check your connection, or type them in.");
}
// Options: every section folds shut (closed by default, remembered). Splits the page at each heading.
function viewOptions() {
  const open = settings().optOpen || {};
  const parts = optionsHtml().split(/(?=<h2[ >])/);
  const tail = parts[parts.length - 1], cut = tail.indexOf('<p class="small muted">Coin Cabinet version');
  let foot = "";
  if (cut > 0) { foot = tail.slice(cut); parts[parts.length - 1] = tail.slice(0, cut); }
  return parts.map((p, i) => {
    const m = p.match(/^<h2[^>]*>([\s\S]*?)<\/h2>/);
    if (!m) return p;
    const title = m[1], key = title.replace(/<[^>]*>/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const on = !!open[key];
    return `<h2 class="fold"><button class="fold-btn" data-act="optSec" data-v="${key}" aria-expanded="${on}"><span>${title}</span><i aria-hidden="true">${on ? "▾" : "▸"}</i></button></h2>${on ? p.slice(m[0].length) : ""}`;
  }).join("") + foot;
}
function optionsHtml() {
  const s = settings();
  const del = deletedCoins().sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
  return `<h1>Options</h1>
    <h2>Spot prices</h2>
    <div class="card">
      ${SPOT_METALS.map((m) => `<label class="f"><span>${m.label} ($ per ${m.unit})</span><input type="number" inputmode="decimal" step="0.01" min="0" data-spot="${m.key}" value="${esc(s.spot[m.key] ?? "")}" placeholder="0.00"></label>`).join("")}
      <div class="btn-row"><button class="btn" id="spotFetch" data-act="fetchSpot">Get live prices</button></div>
      <div class="hint">Filled in for you when the app opens, or tap the button. You can also type prices. <span id="spotStamp">${s.spotUpdated ? "Last updated " + esc(stampText(s.spotUpdated)) + "." : ""}</span> <a href="https://www.kitco.com/" target="_blank" rel="noopener">Look up current prices ↗</a></div>
    </div>
    <h2>Shelf style</h2>
    <div class="card"><div class="chips">${(typeof SHELF_STYLES !== "undefined" ? SHELF_STYLES : []).map(([k, n]) => { const on = shelfStyle() === k; return `<button class="chip ${on ? "on" : ""}" data-act="shelfStyle" data-v="${k}" aria-pressed="${on}">${on ? "✓ " : ""}${n}</button>`; }).join("")}</div>
      <div class="hint">Bookcase: wood shelves; at night only the page around it goes dark. Safe: steel walls, dark all the time.</div></div>
    <h2>Home shelf</h2>
    <div class="card">${typeof shelfOptionsHtml === "function" ? shelfOptionsHtml() : ""}</div>
    ${typeof sellerOptionsHtml === "function" ? sellerOptionsHtml() : ""}
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
    <h2>Adding coins</h2>
    <div class="card">
      <label class="switch"><span>Junk silver goes in My Silver Stack<div class="small muted">For new junk silver coins. Coins you already saved don't change.</div></span><input type="checkbox" data-act="homeTog" data-v="junkStack" ${s.junkStack !== false ? "checked" : ""}></label>
      <label class="switch"><span>Don't ask before putting a coin up for sale</span><input type="checkbox" data-act="homeTog" data-v="skipForSaleAsk" ${s.skipForSaleAsk ? "checked" : ""}></label>
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
    <h2>Report a problem</h2>
    <div class="card">Something wrong or confusing? This opens a note on GitHub with your app version already filled in. Don't put anything private in it, because the page is public.
      <div class="btn-row"><button class="btn" data-act="reportProblem">Report a problem</button></div></div>
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

