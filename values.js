// Coin math: melt, Red Book values, cost, labels, links (split from app.js; plain script, shares the page's global names)
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
// Metals that owned coins need a price for but have none yet (so melt and totals come out low).
function metalsMissingPrice() {
  const keys = new Set();
  ownedCoins().forEach((c) => { const k = meltKey(c); if (k && ozEach(c) && spotPerOz(k) == null) keys.add(k); });
  return SPOT_METALS.filter((m) => keys.has(m.key));
}
// "silver" or "silver and gold" for the warning texts.
const metalWords = (list) => list.map((m) => m.label.toLowerCase()).join(" and ");
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
  const r = bookLookupIn(c, bt);
  // Full Bell Lines with no FBL price for this date or grade (or a grade below the FBL table): use the regular Red Book price.
  if (bt.kind === "fbl" && (!r || r.none || r.below)) {
    const s = PRICE_BOOK.series[c.typeId];
    const r2 = s && s.circ ? bookLookupIn(c, { t: s.circ, kind: "circ" }) : null;
    if (r2 && r2.price != null) return r2;
  }
  return r;
}
function bookLookupIn(c, bt) {
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
  if (best) return { ...best, asked: c.grade };
  // A proof graded under the book's lowest column (PR-63): show that lowest listed price as "at least".
  if (bt.kind === "proof") { const i = bt.t.grades.findIndex((g, k) => row[k] != null); if (i >= 0) return { price: row[i], grade: bt.t.grades[i], kind: "proof", asked: c.grade, atLeast: true, lowest: bt.t.grades[0] }; }
  return { below: true, lowest: bt.t.grades[0], kind: bt.kind };
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
  return `<div class="small muted" style="margin:-4px 0 10px">Mintage ${esc(m.text)}${m.proof ? " proofs" : m.sms ? " SMS sets" : ""}${m.shared ? " (all varieties of this date)" : ""}</div>`;
}
// Plain note for the coin page when the Red Book gives no value (instead of quietly showing face value).
function noBookNote(c) {
  if (itemOf(c) !== "coin" || isJunk(c) || hasProblems(c) || num(c.value) != null) return "";
  if (!c.grade || c.grade === "Other") return "Add a grade to get a Red Book value.";
  const b = bookLookup(c);
  return b && b.price != null ? "" : "No Red Book value for this date and grade.";
}
const bookPrice = (c) => { const b = bookLookup(c); return b && b.price != null ? b.price : null; };
function bookText(b) {
  if (!b) return "";
  const edName = settings().bookEdition || PRICE_BOOK.edition; const ed = edName ? " " + edName : "";
  if (b.none) return "Red Book" + ed + " has no listing for this date" + (b.kind === "proof" ? " and variety." : ".");
  if (b.below) return "Red Book" + ed + " prices start at " + b.lowest + ". Below that it's worth about melt.";
  if (b.atLeast) return "Red Book" + ed + " starts at " + b.grade.replace(/^PR/, "PF") + ": at least " + money(b.price) + " for a proof (yours is " + b.asked.replace(/^PR/, "PF") + ")";
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
const holderOf = (c) => normHolder(c.holder) || (c.albumId ? "Album" : c.gradeMode === "cert" ? "Slab" : "");
const holderText = (c) => { const h = holderOf(c); return h === "Other" ? (c.packaging || "").trim() || "Other" : h; };
// The name of where an item is kept (album, box or stack), for search and lists.
const keptName = (c) => [c.albumId && getAlbum(c.albumId) ? albumTitle(getAlbum(c.albumId)) : "", c.boxId && typeof getBox === "function" && getBox(c.boxId) ? getBox(c.boxId).name : "", stackOf(c)].filter(Boolean).join(" ");
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
// A bar, round, roll or junk-silver stack coin exists (the My Stacks menu item shows only then; the page address still works).
const hasStackItem = () => ownedCoins().some((c) => itemOf(c) === "bullion" || itemOf(c) === "roll" || !!stackOf(c));
const hiddenStacks = () => settings().hiddenStacks || [];
// A stacked item counts only when its group chip AND its stack chip are on.
const countedCoins = () => ownedCoins().filter((c) => !c.biz && !hiddenGroups().includes(groupOf(c)) && !hiddenStacks().includes(stackOf(c)));
const isInherited = (c) => (c.source || "").trim().toLowerCase() === "inherited";
// Inheritances (made in Options): { id, from, date, earlier: [{ who, when }], valueWhen }. A coin points to one with inhId; the first is the default (settings.inhDefault).
const inheritances = () => (Array.isArray(settings().inheritances) ? settings().inheritances : []);
const inheritanceOf = (c) => (c.inhId ? inheritances().find((x) => x.id === c.inhId) || null : null);
const inhLabel = (i) => (i ? [i.from, i.date].filter(Boolean).join(", ") : "");
const inhDefaultId = () => { const l = inheritances(), d = settings().inhDefault; return l.some((x) => x.id === d) ? d : l.length ? l[0].id : ""; };
const inhValueOf = (c) => { const i = inheritanceOf(c); return num(c.inhValue) ?? (i ? num(i.valueWhen) : null); }; // value when inherited, each: the coin's own, else its inheritance's
// What an owned coin still needs: a grade (coins only) and what you paid, or for inherited coins the date you inherited it (an inheritance with a date, or "Acquired").
function missingOf(c) {
  if (!c || c.status !== "owned") return [];
  const m = [];
  if (itemOf(c) === "coin" && !c.grade) m.push("grade");
  if (isInherited(c)) { const i = inheritanceOf(c); if (!(i && String(i.date || "").trim()) && !String(c.acquired || "").trim()) m.push("inherit date"); }
  else if (costOf(c) == null) m.push("cost");
  return m;
}
const needInfoCoins = () => countedCoins().filter((c) => missingOf(c).length); // only coins counted in the Home total
const NEED_NOTE = "Some coins are missing a grade, a cost or the date inherited, so totals are estimates.";
// The amber line under the Home totals; opens My Coins filtered to coins that need info.
function needInfoLine() {
  const n = needInfoCoins().length;
  return n ? `<button class="need-line" data-act="needInfo">${n} coin${n > 1 ? "s" : ""} need${n > 1 ? "" : "s"} info, totals may be off \u203A</button>` : "";
}
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
  if (itemOf(c) === "bullion") return [shapeName(c.bShape), barWeightText(c), num(c.bPurity) ? String(num(c.bPurity)).replace(/^0/, "") : ""].filter(Boolean).join(" · ");
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
  if (itemOf(c) === "bullion") return [barWeightText(c), (c.bMaker || "").trim(), ...(c.bShape === "Other" || c.bShape === "Shape" ? ["Silver item"] : [c.metal || "Silver", c.bShape || "Bar"])].filter(Boolean).join(" ");
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

