// Navigation and pages: Home, Stacks, Value, Coins, coin page (split from app.js; plain script, shares the page's global names)
/* ---------- navigation ---------- */
const VIEWS = ["home", "value", "albums", "wants", "coins", "forsale", "stacks", "boxes", "shows", "reports", "guide", "options"];
function currentRoute() {
  const h = location.hash.replace(/^#/, "");
  if (VIEWS.includes(h)) return { view: h };
  if (h.startsWith("coin-")) return { view: "coin", id: h.slice(5) };
  if (h.startsWith("album-")) return { view: "album", id: h.slice(6) };
  if (h.startsWith("box-")) return { view: "box", id: h.slice(4) };
  if (h.startsWith("show-")) return { view: "show", id: h.slice(5) };
  return { view: "home" };
}
function go(hash) {
  closeMenu();
  if (!$("#sheet").hidden) closeSheet(); // leaving the page closes any open pop-up
  if (location.hash === "#" + hash) render(); else { listState.sel = null; location.hash = hash; } // leaving a page ends Select
  window.scrollTo(0, 0);
}
// Remember the page you were on before opening a coin, so its back button returns there.
let coinBackTo = null;
window.addEventListener("hashchange", (e) => {
  const oldHash = (String(e.oldURL || "").split("#")[1] || "home");
  const nowCoin = location.hash.startsWith("#coin-");
  if (nowCoin && !oldHash.startsWith("coin-")) coinBackTo = oldHash;
  if (!nowCoin) coinBackTo = null;
  listState.sel = null; // Back leaves the page, so Select ends (same as go())
  render();
  window.scrollTo(0, 0);
});
// Where "done" actions (delete, sell) should land: the page you opened the coin from.
const coinBackTarget = () => coinBackTo || "coins";
function coinBackLink() {
  const h = coinBackTo || "coins";
  let name = { home: "My Cabinet", value: "Coin Value", albums: "My Albums", wants: "Want List", coins: "My Coins", stacks: "My Stacks", boxes: "Storage", guide: "PCGS Photograde", options: "Options" }[h];
  if (!name && h.startsWith("box-")) { const b = getBox(h.slice(4)); name = b ? b.name : "Boxes"; }
  if (!name && h.startsWith("album-")) { const a = getAlbum(h.slice(6)); name = a ? albumTitle(a) : "My Albums"; }
  return `<button class="link-btn" data-go="${esc(name ? h : "coins")}">← ${esc(name || "My Coins")}</button>`;
}
function closeMenu() { $("#menu").hidden = true; $("#menuBtn").setAttribute("aria-expanded", "false"); }

/* ---------- rendering ---------- */
function render() {
  const r = currentRoute();
  if (typeof wordsReset === "function") wordsReset(); // the ⓘ help shows once per word per page
  const main = $("#view");
  if (store.mode === "loading") { main.innerHTML = `<div class="empty">Opening your cabinet…</div>`; return; }
  if (typeof ensureIds === "function") ensureIds(); // Step 7.0: every coin gets its ID
  const menuKey = r.view === "coin" || r.view === "forsale" ? "coins" : r.view === "album" ? "albums" : r.view === "box" ? "boxes" : r.view === "show" ? "shows" : r.view;
  $$("#menu button").forEach((b) => b.classList.toggle("on", b.dataset.go === menuKey));
  if (typeof applyShelfStyle === "function") applyShelfStyle();
  if (typeof syncShowsMenu === "function") syncShowsMenu();
  const fn = { home: viewHome, value: viewValue, albums: viewAlbums, album: viewAlbum, wants: viewWants, coins: viewCoins, forsale: typeof viewForSale === "function" ? viewForSale : viewCoins, stacks: viewStacks, boxes: viewBoxes, box: viewBox, shows: typeof viewShows === "function" ? viewShows : viewHome, show: typeof viewShow === "function" ? viewShow : viewHome, reports: typeof viewReports === "function" ? viewReports : viewHome, coin: viewCoin, guide: viewGuide, options: viewOptions }[r.view];
  // Keep the search box focus when the list re-renders.
  const active = document.activeElement;
  const keepSearch = active && active.id === "coinSearch" ? active.selectionStart : null;
  HIDE_NOW = !!settings().hideValues && (r.view === "home" || r.view === "coin");
  try { main.innerHTML = fn(r); } finally { HIDE_NOW = false; }
  if (keepSearch != null) { const s = $("#coinSearch"); if (s) { s.focus(); s.setSelectionRange(keepSearch, keepSearch); } }
}

// Small tags for the new statuses and Upgrade wanted.
function statusTags(c) {
  const k = statusKey(c);
  return (k === "coming" || k === "forsale" || k === "gone" ? `<span class="sold-tag st-${k}">${STATUS_TEXT[k]}</span>` : "")
    + (c.upgrade && c.status === "owned" ? `<span class="sold-tag st-up" title="Upgrade wanted">Upgrade</span>` : "");
}
// A coin still missing something (see missingOf in values.js). Bars, rolls and sets need cost only; inherited coins need the date inherited.
const isIncomplete = (c) => missingOf(c).length > 0;
function coinRow(c, opts = {}) {
  const v = bestEach(c);
  const m = meltEach(c);
  const q = qtyOf(c);
  return `<button class="coin-row" data-go="coin-${esc(c.id)}">
    ${isIncomplete(c) ? `<span class="inc-mark" title="Missing: ${missingOf(c).join(", ")}" aria-label="Missing: ${missingOf(c).join(", ")}"></span>` : ""}${thumbHtml(c)}
    <span class="coin-main">
      <span class="coin-label">${esc(labelOf(c))}</span>
      <span class="coin-sub">${q > 1 ? `<span class="qty">×${q}</span> ` : ""}${c.status === "sold" && c.sold && c.sold.date ? "Sold " + esc(c.sold.date) + " · " : ""}${esc(gradeText(c))}${cacBadge(c)}${c.metal ? " · " + esc(c.metal) : ""}${isInherited(c) ? `<span class="dns" title="Inherited: do not sell">Do not sell</span>` : ""}${c.status === "sold" ? `<span class="sold-tag">Sold</span>` : ""}${statusTags(c)}${opts.miss && isIncomplete(c) ? `<span class="miss-tag">Missing: ${missingOf(c).join(", ")}</span>` : ""}${typeof sellerOn === "function" && sellerOn() && c.biz ? `<span class="sold-tag st-biz">Business</span>` : ""}</span>
    </span>
    <span class="coin-val">${c.status === "sold" ? money(num(c.sold && c.sold.amount)) : money(v == null ? null : v * q)}${m != null && c.status !== "sold" ? `<div class="melt">melt ${q === 1 ? moneyOpen(m) : money(m * q)}</div>` : ""}</span>
  </button>`;
}

const leftOut = () => [...hiddenGroups().filter((g) => groupsPresent().includes(g)), ...hiddenStacks().filter((n) => stacksPresent().includes(n))];
const eyeButton = () => { const on = !!settings().hideValues; return `<div class="eye-row"><button class="chip eye ${on ? "on" : ""}" data-act="hideValues" aria-pressed="${on}" aria-label="${on ? "Show values" : "Hide values"}">${on ? "👁 Show values" : "🙈 Hide values"}</button></div>`; };
// A Home section with a heading you tap to fold shut or open. Each one is remembered.
function homeSection(key, title, inner) {
  const open = !(settings().homeClosed || {})[key];
  return `<h2 class="fold"><button class="fold-btn" data-act="homeSec" data-v="${key}" aria-expanded="${open}"><span>${title}</span><i aria-hidden="true">${open ? "▾" : "▸"}</i></button></h2>${open ? inner : ""}`;
}
function viewHome() {
  const s = settings();
  const everything = ownedCoins().filter((c) => !c.biz);
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
  let html = `${typeof backupReminder === "function" ? backupReminder() : ""}${store.mode === "local" && !allCoins().some((c) => c.status !== "deleted") ? `${welcomeCard()}` : ""}<h1 class="sr-only">Your cabinet</h1>
  ${eyeButton()}
  ${chips.length ? `<div class="chips home-chips" aria-label="Count in the totals">${chips.join("")}</div>` : ""}
  ${typeof shelfHtml === "function" ? shelfHtml(owned, { total, melt, count }) : ""}
  ${fromBook || leftOut().length || noValue ? `<div class="small muted home-notes">${[
    fromBook ? `${fromBook} coin${fromBook > 1 ? "s" : ""} valued from the Red Book.` : "",
    leftOut().length ? `Leaving out: ${leftOut().map(esc).join(", ")}.` : "",
    noValue ? `${noValue} coin${noValue > 1 ? "s" : ""} without a value ${noValue > 1 ? "are" : "is"} counted at melt.` : ""].filter(Boolean).join(" ")}</div>` : ""}
  <div class="stats">
    <div class="stat"><div class="k">Cost</div><div class="v">${money(paid, "$0.00")}</div><div class="small muted">Paid, with tax, shipping and fees</div></div>
    <div class="stat"><div class="k">Gain</div><div class="v ${signCls(gain)}">${gain == null ? "—" : money(gain)}</div><div class="small muted">${gain == null ? "Add prices paid" : pct(paid ? gain / paid : null) + " · inherited not counted"}</div></div>
  </div>${typeof bizPlaqueHtml === "function" ? bizPlaqueHtml() : ""}`;
  if (s.showHistory !== false && levelAtLeast("collector") && typeof historyCard === "function") html += historyCard();

  // Melt Value by Metal, only for metals in the collection
  const metalRows = SPOT_METALS.map((m) => {
    const cs = owned.filter((c) => meltKey(c) === m.key && num(c.oz));
    if (!cs.length) return "";
    const oz = sum(cs, (c) => ozEach(c) * qtyOf(c));
    const mv = sum(cs, (c) => (meltEach(c) || 0) * qtyOf(c));
    return `<div class="rowline"><span>${m.label}<div class="small muted">${sum(cs, qtyOf)} coins · ${oz.toFixed(m.key === "copper" ? 2 : 3)} oz</div></span><span class="num">${spotPerOz(m.key) == null ? `<span class="muted small">no spot price</span>` : money(mv)}</span></div>`;
  }).join("");
  if (metalRows && s.showMeltSec !== false) html += homeSection("melt", "Melt Value by Metal", `<div class="card">${metalRows}</div>`);

  if (s.showSold) html += soldCard();

  const recent = everything.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5);
  if (s.showAdded !== false) html += homeSection("added", "Recently added", recent.length ? `<div class="list">${recent.map((c) => coinRow(c)).join("")}</div>` : `<div class="card empty">No coins yet. Tap <b>+</b> to add your first coin.</div>`);

  const sold = soldCoins().slice().sort((a, b) => {
    const da = (a.sold && a.sold.date) || "", db = (b.sold && b.sold.date) || "";
    return da !== db ? (da < db ? 1 : -1) : ((b.sold && b.sold.at) || 0) - ((a.sold && a.sold.at) || 0);
  }).slice(0, 5);
  if (typeof forSaleHomeHtml === "function") html += forSaleHomeHtml();
  // Only shown once at least one coin has been sold.
  if (sold.length && s.showSoldList !== false) {
    html += homeSection("sold", "Recently sold", `<div class="list">${sold.map((c) => coinRow(c)).join("")}</div>` + (soldCoins().length > 5 ? `<div style="margin-top:8px"><button class="link-btn" data-act="seeSold">See all sold coins</button></div>` : ""));
  }
  return html;
}

function viewStacks() {
  const names = stacksPresent();
  const head = `<h1>My Stacks</h1><div class="small muted" style="margin-bottom:10px">Bars, rounds and junk silver, kept apart from your coins. Each stack counts in your Home totals (switch one off with its chip on Home).</div>`;
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
  const moneyIn = sum(sold, saleMoneyIn); // sold for + shipping charged
  const profit = sum(sold, saleProfit);
  const margin = moneyIn ? profit / moneyIn : null;
  return homeSection("soldres", "Sold results", `<div class="stats">
    <div class="stat"><div class="k">Sold</div><div class="v">${sum(sold, qtyOf)}</div><div class="small muted">${money(revenue, "$0.00")} in sales</div></div>
    <div class="stat"><div class="k">Margin</div><div class="v ${signCls(margin)}">${pct(margin)}</div><div class="small muted">${money(profit, "$0.00")} profit</div></div>
  </div><div class="small muted" style="margin:6px 0 4px">After what you paid, fees, shipping and insurance${sellerOn() ? ", <b>before show costs</b>" : ""}. Inherited coins aren't counted.</div>`);
}

function viewValue() {
  const owned = ownedCoins();
  if (!owned.length) return `<h1>Coin Value</h1><div class="card empty">Add coins to see what they're worth.</div>` + redBookHtml();
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
    <p class="small muted">Values are the ones you enter, then Red Book values, then melt. Use <b>Check eBay sold</b> on any coin to see recent real sale prices.</p>
    ${redBookHtml()}`;
}

/* --- Your Coins --- */
const listState = { family: null, metal: "", cert: "", status: "owned", stage: "", q: "", sort: "year", dir: "asc", f: {}, sel: null }; // f = the extra filters from the Filter panel (filters.js); sel = items ticked in Select mode
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
    (typeof extraFilter !== "function" || extraFilter(c)) &&
    (!listState.q || ((c.cid || "") + " " + (c.oldCids || []).join(" ") + " " + labelOf(c) + " " + gradeText(c) + " " + (c.notes || "") + " " + (c.source || "") + " " + (c.seller || "") + " " + (c.caseName || "") + " " + holderText(c) + " " + keptName(c)).toLowerCase().includes(listState.q.toLowerCase())));
  const key = {
    year: (c) => num(c.year) ?? 99999,
    value: (c) => (bestEach(c) || 0) * qtyOf(c),
    melt: (c) => (meltEach(c) || 0) * qtyOf(c),
    acquired: (c) => c.acquired || "",
    type: (c) => familyOf(c) + " " + String(c.year || "").padStart(5, "0") + (c.mint || ""),
  }[listState.sort];
  list.sort((a, b) => { const x = key(a), y = key(b); return (x > y ? 1 : x < y ? -1 : 0) * (listState.dir === "asc" ? 1 : -1); });
  return `<h1>My Coins</h1>
    <div class="seg" style="margin-bottom:10px">
      <button data-act="status" data-v="owned" class="${listState.status === "owned" ? "on" : ""}">In collection (${sum(ownedCoins().filter((c) => itemOf(c) !== "bullion"), qtyOf)})</button>
      <button data-act="status" data-v="sold" class="${listState.status === "sold" ? "on" : ""}">Sold (${sum(soldCoins(), qtyOf)})</button>
      ${goneCoins().length ? `<button data-act="status" data-v="gone" class="${listState.status === "gone" ? "on" : ""}">Gone (${sum(goneCoins(), qtyOf)})</button>` : ""}
    </div>
    ${stackedN && listState.status === "owned" ? `<div class="small muted" style="margin:-4px 0 8px">${stackedN} bar${stackedN > 1 ? "s, rounds or other silver items are" : ", round or other silver item is"} in <button class="link-btn" data-go="stacks">My Stacks</button>.</div>` : ""}
    ${stages.length ? `<label class="f" style="margin:-4px 0 8px"><span>Show</span><select data-list="stage"><option value="">All in collection</option>${stages.map(([k, l]) => `<option value="${k}" ${listState.stage === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>` : ""}
    <div class="chips">
      <button class="chip ${!listState.family ? "on" : ""}" data-act="fam" data-v="">All</button>
      ${fams.map((f) => `<button class="chip ${listState.family === f ? "on" : ""} ${famCounts[f] ? "" : "zero"}" data-act="fam" data-v="${esc(f)}">${esc(f)}${famCounts[f] ? " · " + famCounts[f] : ""}</button>`).join("")}
    </div>
    <div class="toolbar">
      <input type="search" id="coinSearch" placeholder="Search" value="${esc(listState.q)}" data-list="q">
    </div>
    ${typeof coinsControls === "function" ? coinsControls(base, list) : (listState.q.trim() ? searchLine(list) : "")}
    <div class="toolbar">
      <select data-list="sort" aria-label="Sort by">${[["year", "Year"], ["value", "Value"], ["melt", "Melt value"], ["acquired", "Date acquired"], ["type", "Coin type"]].map(([k, l]) => `<option value="${k}" ${listState.sort === k ? "selected" : ""}>Sort: ${l}</option>`).join("")}</select>
      <button class="btn" data-act="dir" style="flex:0 0 auto">${listState.dir === "asc" ? "↑ Low to high" : "↓ High to low"}</button>
    </div>
    ${list.length ? `<div class="list">${list.map((c) => (listState.sel && typeof selRow === "function" ? selRow(c) : coinRow(c, { miss: true }))).join("")}</div>${typeof selFootHtml === "function" ? selFootHtml() : ""}` : `<div class="card empty">${base.length ? "No coins match these filters." : listState.status === "sold" ? "No sold coins yet." : "No coins yet. Tap <b>+</b> to add one."}</div>`}`;
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
  return `<div class="card"><b>Errors and problems</b>${row("Known variety", esc(c.knownVar))}${row("Mint errors", esc(errs.join(", ")))}${row("Problems", probs.length ? esc(probs.join(", ")) + ` <span class="muted small">(Details coin)</span>${wi("details")}` : null)}${c.errorNote ? `<div class="small" style="white-space:pre-wrap;margin-top:4px">${esc(c.errorNote)}</div>` : ""}</div>`;
}
function viewCoin(r) {
  const c = getCoin(r.id);
  if (!c || c.status === "deleted") return `<div class="card empty">That coin isn't here. <button class="link-btn" data-go="coins">Back to My Coins</button></div>`;
  const q = qtyOf(c);
  const v = valueEach(c);
  const m = meltEach(c);
  const album = c.albumId ? getAlbum(c.albumId) : null;
  const row = (k, val) => (val == null || val === "" ? "" : `<div class="rowline"><span class="muted">${k}</span><span class="num" style="text-align:right">${val}</span></div>`);
  const sold = c.sold || {};
  return `${coinBackLink()}${eyeButton()}
    <h1 style="margin-top:10px">${esc(labelOf(c))}${isInherited(c) ? ` <span class="dns">Inherited · do not sell</span>` : ""}</h1>
    ${album && c.status === "owned" ? `<div class="album-chip"><span aria-hidden="true">📖</span> In <button class="link-btn" data-go="album-${esc(album.id)}">${esc(albumTitle(album))}</button></div>` : ""}
    <div class="small muted" style="margin:-4px 0 8px">ID <b>${c.cid ? esc(c.cid) : "No ID"}</b> <button class="link-btn" data-act="editId" data-id="${esc(c.id)}">${c.cid ? "Change" : "Add"}</button>${(c.oldCids || []).length ? ` · old ID${c.oldCids.length > 1 ? "s" : ""}: ${esc(c.oldCids.join(", "))}` : ""}</div>
    ${mintageLine(c)}${typeof coinInhHtml === "function" ? coinInhHtml(c) : ""}
    ${(c.photos || []).length ? `<div class="detail-photos">${c.photos.map((p) => `<img src="${esc(photoSrc(p))}" alt="Coin photo">`).join("")}</div>` : ""}
    <div class="card">
      ${row("Status", esc(STATUS_TEXT[statusKey(c)] || "") + (c.upgrade && c.status === "owned" ? " · Upgrade wanted" : ""))}
      ${itemOf(c) === "coin" ? row("Grade", esc(gradeText(c)) + cacBadge(c) + (photoGuideCode(c) ? ` <a class="small" href="${esc(photoGuideUrl(c))}" target="_blank" rel="noopener">PCGS photos ↗</a>` : "")) : ""}
      ${itemOf(c) === "set" ? row("Set", esc(c.typeName)) : ""}
      ${itemOf(c) === "bullion" ? row("Type", esc(shapeName(c.bShape))) + row("Maker", esc(c.bMaker)) + row("Serial number", esc(c.bSerial)) + row("Weight", num(c.bWeight) ? esc(barWeightText(c)) : null) + row("Purity", esc(c.bPurity)) : ""}
      ${stackOf(c) ? row("Stack", esc(stackOf(c))) : ""}
      ${itemOf(c) === "roll" ? row("Coins in roll", rollCountOf(c)) + row("Face value", rollFace(c) == null ? null : money(rollFace(c))) + row("Condition", esc([c.rollCond, c.bankWrap ? "Original bank wrap" : ""].filter(Boolean).join(" · "))) : ""}
      ${c.gradeMode === "cert" ? row("Cert number", esc(c.cert)) : ""}
      ${c.gradeMode === "cert" ? row("Catalog number", esc(c.catNo)) : ""}
      ${row("Holder", esc(holderText(c)))}
      ${(() => { const bx = c.boxId && getBox(c.boxId); return bx ? row(bx.type === "display" ? "Display box" : "Storage box", esc(boxText(c))) : ""; })()}
      ${row("COA", c.coa ? "Included" : null)}
      ${holderOf(c) !== "Other" ? row("Box / packaging", esc(c.packaging)) : ""}
      ${row("Quantity", q > 1 ? q : null)}
      ${row(itemOf(c) === "bullion" && valueSource(c) === "melt" ? "Value (melt)" : isJunk(c) ? "Value (junk = melt)" : valueSource(c) === "book" ? (bookLookup(c) && bookLookup(c).atLeast ? "Value each (at least, Red Book)" : "Value each (Red Book)") : valueSource(c) === "face" ? (meltKey(c) && num(c.oz) && spotPerOz(meltKey(c)) == null ? "Value each (face value, no " + meltKey(c) + " price yet)" : "Value each (face value)") : "Value" + eachWord(c), money(v))}
      ${noBookNote(c) ? `<div class="small muted" style="margin:2px 0 6px">${esc(noBookNote(c))}</div>` : ""}
      ${valueSource(c) === "entered" && bookPrice(c) != null ? row("Red Book", money(bookPrice(c)) + ` <span class="muted small">${esc(bookLookup(c).grade.replace(/^PR/, "PF"))}</span>`) : ""}
      ${row("Melt" + eachWord(c) + wi("melt"), m == null ? (meltKey(c) ? "Enter spot price" : null) : moneyOpen(m))}
      ${q > 1 ? row("Total value", money((bestEach(c) || 0) * q)) : ""}
      ${row("Metal", esc([c.metal, num(c.oz) ? num(c.oz) + " oz" + (itemOf(c) === "roll" ? " per coin" : itemOf(c) === "set" ? " in the set" : itemOf(c) === "bullion" ? " pure" : "") : ""].filter(Boolean).join(" · ")))}
    </div>
    ${c.notes ? `<div class="card"><div class="muted small">Notes</div><div style="white-space:pre-wrap">${esc(c.notes)}</div></div>` : ""}
    ${purchaseCard(c, row)}
    ${errorsCard(c, row)}
    ${c.trackNo ? `<div class="card"><b>${stageOf(c) === "coming" ? "On the way" : "Shipping"}</b>${row("Tracking", esc(c.trackNo))}${row("Carrier", esc(carrierOf(c) || "Not sure"))}${row("Received", esc(c.receivedDate || ""))}
      <a class="btn block" style="display:block;text-align:center;text-decoration:none;color:inherit;margin-top:8px" href="${esc(trackUrl(c))}" target="_blank" rel="noopener">Track package ↗</a></div>` : ""}
    ${stageOf(c) === "coming" ? `<button class="btn block primary" style="margin-bottom:8px" data-act="received" data-id="${esc(c.id)}">✓ Mark as received</button>` : ""}
    ${c.status === "gone" ? `<div class="card"><b>Gone</b>${row("Why", esc((c.gone && c.gone.reason) || ""))}${row("Date", esc((c.gone && c.gone.date) || ""))}<div class="small muted">Not counted in your totals.</div></div>` : ""}
    ${c.status === "sold" ? `<div class="card"><b>Sold</b>${row("ID", esc(c.cid))}${row("Date", esc(sold.date))}${row("Sold for", money(num(sold.amount)))}${row("Shipping charged", num(sold.shipCharged) == null ? null : money(num(sold.shipCharged)))}${row("Platform fees", num(sold.fees) == null ? null : money(num(sold.fees)))}${row("Shipping paid", num(sold.shipping) == null ? null : money(num(sold.shipping)))}${row("Insurance", num(sold.insurance) == null ? null : money(num(sold.insurance)))}${row("Sales tax collected", num(sold.salesTax) == null ? null : money(num(sold.salesTax)))}${row("Paid with", esc(sold.payMethod))}${row("Where", esc(whereText(sold)))}${row("Was kept in", esc(sold.keptIn))}${row("Sold to", esc(sold.to))}${row("Order number", esc(sold.orderNo))}${row("Tracking", sold.trackNo ? `<a href="${esc(trackUrl({ trackNo: sold.trackNo, trackCarrier: sold.carrier }))}" target="_blank" rel="noopener">${esc(sold.trackNo)} ↗</a>` : "")}${isInherited(c) ? "" : row("What you paid", costOf(c) == null ? null : money(costOf(c))) + row("Profit", typeof saleProfit === "function" ? `<b class="${signCls(saleProfit(c))}">${money(saleProfit(c))}</b>` : null)}</div>` : ""}
    ${caseCard(c)}
    ${typeof askCard === "function" ? askCard(c) : ""}
    ${certUrl(c) ? `<a class="btn block" style="display:block;text-align:center;text-decoration:none;color:inherit;margin-bottom:8px" href="${esc(certUrl(c))}" target="_blank" rel="noopener">Verify cert on ${esc(c.service)} ↗</a>` : ""}
    <a class="btn block" style="display:block;text-align:center;text-decoration:none;color:inherit" href="${esc(ebayUrl(c))}" target="_blank" rel="noopener">Check eBay sold ↗</a>
    ${c.status === "owned" && itemOf(c) === "coin" ? `<button class="btn block" style="margin-bottom:8px" data-act="addAnother" data-id="${esc(c.id)}">+ Add another${c.typeId ? " " + esc(shortName(TYPE_BY_ID[c.typeId] || { name: c.typeName })) : ""}</button>` : ""}
    <div class="btn-row">
      <button class="btn primary" data-act="edit" data-id="${esc(c.id)}">Edit</button>
      ${c.status === "owned" ? `${isInherited(c) ? "" : stageOf(c) === "forsale" ? `<button class="btn" data-act="notForSale" data-id="${esc(c.id)}">Take off For sale</button>` : `<button class="btn" data-act="forSale" data-id="${esc(c.id)}">For sale</button>`}<button class="btn" data-act="sell" data-id="${esc(c.id)}">Mark as sold</button>${typeof bizButton === "function" ? bizButton(c) : ""}` : c.status === "gone" ? `<button class="btn" data-act="ungone" data-id="${esc(c.id)}">Move back to collection</button>` : `<button class="btn" data-act="editSale" data-id="${esc(c.id)}">Edit sale</button><button class="btn" data-act="unsell" data-id="${esc(c.id)}">Move back to collection</button>`}
      <button class="btn danger" data-act="delete" data-id="${esc(c.id)}">Delete</button>
    </div>`;
}

