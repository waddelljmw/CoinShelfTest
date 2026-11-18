// Step 3b: the coin card's facts, written once and shown on empty album spots and on your owned coins' pages.
// Key date flag (a low mintage, worked out from the U.S. Mint list in catalog/mintages.js, not a hand-picked list),
// varieties to look for (KNOWN_VARIETIES), how many you own, and, for coins you don't have yet, metal and melt today.
const KEY_ABS = 1500000, KEY_SHARE = 0.1; // key date = at most 10% of the type's typical year and under 1.5 million
const _keyMedian = {};
function typeMedianMintage(typeId) {
  if (_keyMedian[typeId] != null) return _keyMedian[typeId];
  const rows = (typeof MINT_RECORDS !== "undefined" && MINT_RECORDS[typeId]) || {};
  const a = [];
  Object.keys(rows).forEach((y) => Object.keys(rows[y]).forEach((m) => a.push(rows[y][m])));
  a.sort((x, y) => x - y);
  return (_keyMedian[typeId] = a.length ? a[a.length >> 1] : 0);
}
// { n, limit } when this date and mint is a key date by the rule above, else null. Business strikes only, like the mintage list.
function keyDateInfo(c) {
  if (typeof MINT_RECORDS === "undefined" || !c || !c.typeId || !c.year || isProofGrade(c.grade) || c.sms) return null;
  const row = (MINT_RECORDS[c.typeId] || {})[Number(c.year)];
  const n = row ? row[normMint(c.mint) || "P"] : null;
  const med = typeMedianMintage(c.typeId);
  if (n == null || !med) return null;
  const limit = Math.min(Math.round(med * KEY_SHARE), KEY_ABS);
  return n <= limit ? { n, limit } : null;
}
// The owned coins of this date and mint (all varieties, all albums).
function ownedOfDate(c) {
  if (!c || !c.typeId || !c.year) return [];
  return ownedCoins().filter((o) => itemOf(o) === "coin" && o.typeId === c.typeId && String(o.year) === String(c.year) && (normMint(o.mint) || "P") === (normMint(c.mint) || "P"));
}
function ownCountOf(c) { return ownedOfDate(c).reduce((s, o) => s + qtyOf(o), 0); }
// "You own 2: F-12, G-4" / "2× F-12" / "no grade" (a blank grade); one entry per coin, repeats grouped.
function ownGradesText(c) {
  const g = {}, order = [];
  ownedOfDate(c).forEach((o) => { const k = o.grade || "no grade"; if (!(k in g)) { g[k] = 0; order.push(k); } g[k] += qtyOf(o); });
  const n = order.reduce((s, k) => s + g[k], 0);
  return n ? `You own ${n}: ${order.map((k) => (g[k] > 1 ? `${g[k]}× ${k}` : k)).join(", ")}` : "";
}
// c = the coin (or pretend coin for an empty spot). opts.spot: an empty spot (adds metal, melt and price-list value);
// opts.skipId: the coin page's own id; opts.inAlbum: the spot's coin is already in this album.
function coinCardHtml(c, opts) {
  opts = opts || {};
  const t = TYPE_BY_ID[c.typeId];
  const lines = [];
  const key = keyDateInfo(c);
  if (key) lines.push(`<div><span class="chip" style="background:var(--warn,#f5d27a);color:#222;padding:1px 8px;border-radius:10px;font-weight:600">Key date</span> only ${key.n.toLocaleString("en-US")} struck, ${Math.round(key.n / typeMedianMintage(c.typeId) * 100)}% of a typical ${esc(t ? shortName(t) : "year")} year <span class="muted">(low mintage)</span></div>`);
  if ((opts.spot || opts.lookup) && t && t.oz) {
    const melt = meltEach({ metal: t.metal, oz: t.oz });
    lines.push(`<div>${esc(t.metal)}: ${Math.round(t.oz * 1000) / 1000} oz${melt != null ? ` · melt today ${money(melt)}` : ""}</div>`);
  }
  if ((opts.spot || opts.lookup) && typeof PRICE_BOOK !== "undefined" && PRICE_BOOK.series && PRICE_BOOK.series[c.typeId]) {
    const r = bookLookup({ ...c, grade: c.grade || "VF-20" });
    if (r && r.price != null) lines.push(`<div>${esc(bookName())} ${esc(r.grade)}: ${money(r.price)}</div>`);
  }
  const vs = knownVarieties(c);
  if (vs.length) lines.push(`<div>Varieties to look for: ${esc(vs.join(", "))}</div>`);
  const own = ownCountOf(c);
  if (opts.lookup) lines.push(`<div><b>${own ? esc(ownGradesText(c)) : "You don't own this one yet"}</b></div>`);
  else if (opts.spot) lines.push(`<div><b>${opts.inAlbum ? "This spot is filled" : own ? "Not in this album yet" : "Empty spot in your album"}</b>${own ? ` · ${esc(ownGradesText(c))}` : ""}</div>`);
  else if (own > 1) lines.push(`<div>${esc(ownGradesText(c))}</div>`);
  return lines.length ? `<div class="card small" style="margin:0 0 10px">${lines.join("")}</div>` : "";
}

// Step 4a: look up any coin by typing it in the Coins search box ("1916-D dime", "1909 vdb", "1921 morgan").
// Needs a 4-digit year; the rest are words that match coin types (names, nicknames) and an optional mint mark.
// Returns up to 6 { typeId, year, mint } (mint "" = Philadelphia). Nothing is saved.
function lookupMatches(q) {
  const words = String(q || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  let year = null, mint = null;
  const rest = [];
  words.forEach((w) => {
    const m = w.match(/^(\d{4})-?(p|d|s|o|cc|w)?$/);
    if (m && year == null) { year = +m[1]; if (m[2]) mint = m[2].toUpperCase(); }
    else if (year != null && mint == null && /^(p|d|s|o|cc|w)$/.test(w)) mint = w.toUpperCase();
    else rest.push(w);
  });
  if (year == null || year < 1700 || year > thisYear()) return [];
  const out = [];
  COIN_TYPES.forEach((t) => {
    if (out.length >= 6 || !typeMadeIn(t, year)) return;
    const hay = (t.name + " " + t.family + " " + t.denom + " " + nickWords(t.id, year)).toLowerCase();
    if (!rest.every((w) => hay.includes(w))) return;
    const hit = (EXACT_SLOTS[t.id] || []).find((x) => x[0] === year);
    const mints = mint ? [mint] : hit ? hit[1].split(" ") : [""];
    mints.forEach((m) => {
      if (out.length < 6 && !mintWarning(t.id, year, m === "P" ? "" : m)) out.push({ typeId: t.id, year, mint: m === "P" ? "" : m });
    });
  });
  return out;
}
const lookupLabel = (r) => { const t = TYPE_BY_ID[r.typeId]; return `${r.year}${r.mint ? "-" + r.mint : ""} ${t ? shortName(t) : ""} ${t ? t.denom : ""}`.replace(/\s+/g, " ").trim(); };
// Rows under the Coins search box: "Look up a coin card" for what was typed.
function lookupRowsHtml(q) {
  const rs = lookupMatches(q);
  if (!rs.length) return "";
  return `<div class="card small" style="margin:0 0 10px"><div class="muted" style="margin-bottom:4px">Look up a coin (owned or not)</div>${rs.map((r) => `<button class="link-btn" style="display:block;padding:6px 0;text-align:left" data-act="lookupOpen" data-t="${esc(r.typeId)}" data-y="${r.year}" data-m="${esc(r.mint)}">${esc(lookupLabel(r))} ›</button>`).join("")}</div>`;
}
const lookupFake = (el) => { const t = TYPE_BY_ID[el.dataset.t]; return { typeId: t.id, typeName: shortName(t), denom: t.denom, year: +el.dataset.y, mint: el.dataset.m || "", variety: "", gradeMode: "raw", grade: "VF-20" }; };
function lookupOpen(el) {
  if (!TYPE_BY_ID[el.dataset.t]) return;
  const fake = lookupFake(el), mt = mintageInfo(fake);
  const wanted = !!findWant(fake.typeId, fake.year, fake.mint, "", DEFAULT_LIST_ID, false);
  openSheet(`<div class="sheet-head"><h2>${esc(lookupLabel(fake))}</h2><button class="x" data-act="closeSheet" aria-label="Close">\u2715</button></div>
    <div class="small muted" style="margin:-4px 0 12px">${mt ? "Mintage " + esc(mt.text) + (mt.note ? " (" + esc(mt.note) + ")" : "") : "No mintage in the app for this one"}</div>
    ${coinCardHtml(fake, { lookup: true })}
    ${wanted ? `<div class="hint">\u2605 Already on your want list.</div>` : `<button class="btn block btn-want" data-act="lookupWant" data-t="${esc(fake.typeId)}" data-y="${fake.year}" data-m="${esc(fake.mint)}">\u2605 Add to want list</button>`}
    <div class="btn-row"><a class="btn" style="text-align:center;text-decoration:none;color:inherit" href="${esc(ebayUrl(fake))}" target="_blank" rel="noopener">Search eBay sold \u2197</a></div>`);
}
function lookupWant(el) {
  if (!TYPE_BY_ID[el.dataset.t]) return;
  ensureDefaultList();
  const f = lookupFake(el);
  if (!findWant(f.typeId, f.year, f.mint, "", DEFAULT_LIST_ID, false)) saveWant(newWant({ typeId: f.typeId, year: f.year, mint: f.mint, listId: DEFAULT_LIST_ID }));
  closeSheet();
  toast("Added to " + ((getWantList(DEFAULT_LIST_ID) || {}).name || "your want list") + ".");
}
Object.assign(actions, { lookupOpen, lookupWant });
