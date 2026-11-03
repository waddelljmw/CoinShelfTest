/* Demo mode (Step 9.1): a made-up sample collection so a friend can try the app without seeing real coins.
   Loaded only when the demo opens. Everything stays in memory; nothing is saved to the phone or the Claude account.
   Dates and mints come from the app's own coin data; values come from the app's Red Book data (none typed here).
   Coin pictures are drawn by demoPic() below, so there are no picture files. */
"use strict";

const DEMO_METAL_COLORS = { Silver: ["#e3e5e8", "#9ea3aa"], Gold: ["#f1d36b", "#b8932a"], Platinum: ["#eceff2", "#aab2ba"], Copper: ["#d9915a", "#8f4f26"], "Copper-nickel": ["#d8d4cb", "#8e8a80"], Zinc: ["#cfcfca", "#8a8a84"], Steel: ["#cfcfca", "#8a8a84"], Clad: ["#dcdde0", "#9a9da3"], Other: ["#d9c27a", "#9b8444"] };

// One small drawing function for every coin: metal color, denomination and year. "front" or "back".
function demoPic(c, side, example) {
  const [lo, hi] = DEMO_METAL_COLORS[c.metal] || DEMO_METAL_COLORS.Other;
  const front = side !== "back";
  const mid = front ? String(c.year || "") : String(c.denom || "").toUpperCase();
  const top = front ? String(c.denom || "") : "SAMPLE";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><radialGradient id="g" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="${lo}"/><stop offset="1" stop-color="${hi}"/></radialGradient></defs>
<rect width="120" height="120" fill="#f3efe6"/>${example ? `<text x="60" y="12" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="#a33">EXAMPLE</text>` : ""}
<circle cx="60" cy="63" r="48" fill="url(#g)" stroke="#6d6a62" stroke-width="2"/><circle cx="60" cy="63" r="42" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.5"/>
<text x="60" y="40" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#3b3a36">${top}</text>
<text x="60" y="73" text-anchor="middle" font-family="Georgia,serif" font-size="${mid.length > 4 ? 15 : 24}" font-weight="bold" fill="#3b3a36">${mid}</text>
<text x="60" y="94" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#3b3a36">${front ? (c.mint ? "mint " + c.mint : "") : "DEMO"}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// ---- the sample lists (type id, year, mint, grade, paid) ----
const DEMO_SINGLES = [ // 22 coins; the first is the gold coin, the second is the one "filled in from photos"
  ["indian-2-5", 1910, "P", "MS-62", 1450, { gradeMode: "cert", service: "PCGS", holder: "Slab" }],
  ["morgan-dollar", 1921, "D", "MS-63", 85, { notes: "Filled in from photos (example).", photoFilled: true }],
  ["peace-dollar", 1923, "P", "MS-64", 70], ["walking-liberty-half", 1943, "P", "MS-63", 55], ["franklin-half", 1963, "D", "MS-65", 60],
  ["mercury-dime", 1941, "S", "MS-64", 22], ["roosevelt-silver", 1957, "D", "MS-66", 18], ["washington-silver", 1964, "D", "MS-65", 30],
  ["buffalo-nickel", 1936, "P", "XF-45", 9], ["jefferson-war-nickel", 1943, "P", "AU-58", 6], ["liberty-nickel", 1899, "P", "VF-25", 8],
  ["barber-dime", 1905, "P", "F-12", 6], ["barber-quarter", 1908, "P", "VF-30", 14], ["standing-liberty-quarter", 1929, "P", "XF-40", 38],
  ["indian-cent", 1907, "P", "XF-40", 12], ["kennedy-90", 1964, "P", "MS-65", 24], ["silver-eagle", 2019, "W", "MS-69", 52, { gradeMode: "cert", service: "NGC", holder: "Slab" }],
  ["saint-gaudens-20", 1924, "P", "MS-63", 2650, { gradeMode: "cert", service: "PCGS", holder: "Slab" }], ["liberty-20", 1904, "P", "MS-62", 2400, { gradeMode: "cert", service: "NGC", holder: "Slab" }],
  ["indian-10", 1926, "P", "MS-63", 1350, { gradeMode: "cert", service: "PCGS", holder: "Slab" }], ["state-quarter", 2004, "D", "MS-65", 2],
  ["lincoln-wheat", 1944, "D", "MS-65", 3],
];
const DEMO_ROLLS = [["lincoln-wheat", 50, "Circulated", 14], ["roosevelt-silver", 50, "AU", 190], ["washington-silver", 40, "Circulated", 330]]; // type, coins in roll, condition, paid
const DEMO_BARS = [ // shape, weight (oz), maker, count, paid each
  ["Bar", 1, "Sample Refinery", 1, 33], ["Bar", 10, "Sample Refinery", 1, 335], ["Round", 1, "Sample Mint", 10, 32],
];
const DEMO_MORGAN_MISSING = ["1878|CC", "1879|CC", "1884|S", "1885|CC", "1886|O", "1889|CC", "1890|CC", "1891|CC"]; // the rare, costly dates are the empty spots
const DEMO_BUSINESS = [ // business stock: type, year, mint, grade, paid, asking price
  ["morgan-dollar", 1921, "S", "MS-63", 60, 95], ["peace-dollar", 1922, "P", "MS-63", 38, 62], ["silver-eagle", 2015, "P", "MS-69", 34, 52],
  ["walking-liberty-half", 1941, "D", "MS-64", 30, 48], ["mercury-dime", 1944, "P", "MS-65", 10, 20], ["washington-silver", 1954, "D", "MS-65", 20, 34],
];
const DEMO_SOLD = [ // sold coins: type, year, mint, grade, paid, sold for, where, at the show?
  ["morgan-dollar", 1902, "O", "MS-62", 45, 62, "eBay", false], ["peace-dollar", 1925, "P", "MS-63", 42, 61, "Whatnot", false],
  ["franklin-half", 1952, "D", "MS-64", 25, 44, "Coin show", true], ["roosevelt-silver", 1949, "S", "MS-65", 14, 28, "Coin show", true],
  ["buffalo-nickel", 1937, "D", "AU-55", 7, 15, "Private sale", false],
];
const DEMO_WANTS = [["morgan-dollar", 1893, "S", "VF-20"], ["walking-liberty-half", 1921, "S", "VG-8"], ["buffalo-nickel", 1926, "S", "F-12"]];
const DEMO_GRADE_CYCLE = ["VF-30", "XF-45", "AU-55", "MS-60", "MS-63", "MS-64"];
const DEMO_PAID_CYCLE = [38, 52, 75, 95, 140, 210];

function demoDocs() {
  const docs = [];
  let n = 0;
  const day = (back) => { const d = new Date(); d.setDate(d.getDate() - back); return localDate(d); };
  const mk = (typeId, year, mint, grade, paid, o) => {
    n++;
    const t = TYPE_BY_ID[typeId];
    const c = blankCoin();
    Object.assign(c, { id: "demo" + n, typeId, typeName: shortName(t), family: t.family, denom: t.denom, metal: t.metal, oz: t.oz || "", year, mint: normMint(mint), grade, paid: paid == null ? "" : String(paid),
      source: ["Coin Shop", "Coin Show", "eBay", "Whatnot", "Gift"][n % 5], acquired: day(20 + n * 9), createdAt: Date.now() - n * 3600000, holder: "Plastic flip" }, o || {});
    applyYearMetal(c);
    c.label = autoLabel(c);
    return c;
  };
  const add = (c) => { docs.push(["c_" + c.id, c]); return c; };
  // Single coins, each with two drawn pictures.
  DEMO_SINGLES.forEach(([t, y, m, g, p, o]) => {
    const extra = { ...(o || {}) }; const filled = extra.photoFilled; delete extra.photoFilled;
    const c = mk(t, y, m, g, p, extra);
    c.photos = [{ url: demoPic(c, "front", filled) }, { url: demoPic(c, "back", filled) }];
    add(c);
  });
  // Rolls.
  DEMO_ROLLS.forEach(([t, count, cond, p]) => add(mk(t, "", "", "", p, { item: "roll", rollCount: count, rollCond: cond, holder: "Paper wrap", bankWrap: false, source: "Bank roll" })));
  // Silver bars and rounds (My Silver Stack).
  DEMO_BARS.forEach(([shape, w, maker, qty, p]) => {
    n++;
    const c = blankCoin();
    Object.assign(c, { id: "demo" + n, item: "bullion", bShape: shape, bWeight: String(w), bUnit: "oz", bPurity: "0.999", bMaker: maker, bSerial: "", qty, paid: String(p), metal: "Silver", family: "Bullion", typeName: "Bullion", stack: "My Silver Stack", acquired: day(40 + n * 7), source: "Coin Shop", createdAt: Date.now() - n * 3600000 });
    c.oz = String(bullionOz(c)); c.label = autoLabel(c);
    add(c);
  });
  // A black box of wheat cents in 2x2 flips (5 rows of 5).
  const box = { kind: "box", id: "demobox", name: "Black box: wheat cents", rows: 5, perRow: 5, type: "storage", look: "black", spots: true, inside: "Wheat cents in 2x2 flips", createdAt: Date.now() - 99 * 86400000 };
  docs.push(["b_demobox", box]);
  const wheat = EXACT_SLOTS["lincoln-wheat"], grades = ["F-12", "VF-30", "XF-40", "AU-50", "MS-63"];
  for (let i = 0; i < 25; i++) {
    const y = 1934 + i, ms = (wheat.find((x) => x[0] === y) || [y, "P D"])[1].split(" ");
    add(mk("lincoln-wheat", y, ms[i % ms.length], grades[i % grades.length], 1 + (i % 4), { holder: "2x2 cardboard flip", boxId: "demobox", boxRow: Math.floor(i / 5) + 1, boxSlot: (i % 5) + 1, source: "Coin Show" }));
  }
  // Album 1: Whitman Morgan Dollars Vol. 1 (1878–1891), about 85% full; the empty spots are the rare dates.
  const am = { kind: "album", id: "demoalbum1", brand: "Whitman", number: "9128", name: "Morgan Dollars Vol. 1, 1878–1891", typeId: "morgan-dollar", typeIds: ["morgan-dollar"], layout: "dates", start: 1878, end: 1891, proofs: "", removed: [], createdAt: Date.now() - 200 * 86400000 };
  am.slots = buildAlbumSlots(am.typeIds, "dates", am.start, am.end, "");
  docs.push(["a_demoalbum1", am]);
  am.slots.filter((s) => !DEMO_MORGAN_MISSING.includes(s.y + "|" + (s.m || "P"))).forEach((s, i) => {
    add(mk("morgan-dollar", s.y, s.m, s.m === "S" || s.m === "CC" ? ["VF-30", "XF-45", "AU-55"][i % 3] : DEMO_GRADE_CYCLE[i % 6], DEMO_PAID_CYCLE[i % 6], { holder: "Album", albumId: am.id, slotId: s.id, source: "Coin Shop" }));
  });
  // Album 2: Dansco Lincoln Cents 1909–1958, lightly filled (12 spots from the 1950s).
  const al = { kind: "album", id: "demoalbum2", brand: "Dansco", number: "7103", name: "Lincoln Cents 1909–1958", typeId: "lincoln-wheat", typeIds: ["lincoln-wheat"], layout: "dates", start: 1909, end: 1958, proofs: "", removed: [], createdAt: Date.now() - 150 * 86400000 };
  al.slots = buildAlbumSlots(al.typeIds, "dates", al.start, al.end, "");
  docs.push(["a_demoalbum2", al]);
  al.slots.filter((s) => s.y >= 1947).slice(0, 12).forEach((s, i) => add(mk("lincoln-wheat", s.y, s.m, ["VF-30", "XF-40", "AU-50", "MS-63"][i % 4], 1 + (i % 3), { holder: "Album", albumId: al.id, slotId: s.id, source: "Pocket change" })));
  // Business stock, shows, sold coins.
  DEMO_BUSINESS.forEach(([t, y, m, g, p, ask]) => add(mk(t, y, m, g, p, { biz: true, stage: "forsale", ask: String(ask), holder: "Plastic flip", source: "Coin Show" })));
  const show = { kind: "show", id: "demoshow", name: "Sample Coin Show", start: day(21), type: "coinshow", place: "Anytown Convention Hall", role: "seller", costs: { table: 150 }, createdAt: Date.now() - 30 * 86400000 };
  docs.push(["sh_demoshow", show]);
  DEMO_SOLD.forEach(([t, y, m, g, p, amt, where, atShow], i) => {
    const c = mk(t, y, m, g, p, { status: "sold", biz: atShow, holder: "Plastic flip" });
    c.sold = { at: Date.now() - (10 + i * 12) * 86400000, date: day(atShow ? 21 : 10 + i * 12), amount: amt, fees: where === "eBay" ? 7 : where === "Whatnot" ? 6 : 0, shipping: where === "eBay" || where === "Whatnot" ? 5 : 0, whereType: where, whereDetail: where === "Coin show" ? show.name : "", where: where === "Coin show" ? "Coin show: " + show.name : where, ...(atShow ? { showId: show.id } : {}) };
    add(c);
  });
  // Want list.
  docs.push(["wl_" + DEFAULT_LIST_ID, { kind: "wantlist", id: DEFAULT_LIST_ID, name: "General", scope: "any", createdAt: 0 }]);
  DEMO_WANTS.forEach(([t, y, m, g], i) => { const w = newWant({ typeId: t, year: y, mint: m, grade: g, maxPrice: "" }); w.id = "demowant" + i; docs.push(["w_" + w.id, w]); });
  // Settings: made-up metal prices, Seller Mode on, no backup reminder.
  docs.push(["settings", { ...DEFAULT_SETTINGS, spot: { gold: 2700, silver: 32, platinum: 1000, copper: 4.2 }, spotUpdated: null, seller: { on: true, profile: { name: "Sample Coin Co.", ein: "", address: "", permit: "" } }, lastBackup: today(), soldAutoDone: true }]);
  return docs;
}

// About 12 months of value history, shaped from the demo collection's own totals.
function demoHistory() {
  const t = currentTotals(), days = {};
  for (let i = 0; i <= 12; i++) {
    const d = new Date(); d.setMonth(d.getMonth() - (12 - i)); d.setDate(1);
    const k = localDate(d), f = 0.7 + 0.3 * (i / 12) + (i % 3 === 1 ? 0.012 : 0);
    days[k] = { v: Math.round(t.v * f * 100) / 100, m: Math.round(t.m * (0.78 + 0.22 * (i / 12)) * 100) / 100, n: Math.max(1, Math.round(t.n * (0.62 + 0.38 * (i / 12)))) };
  }
  days[today()] = t;
  return { kind: "history", days };
}

/* ---- "See photo fill in action": fills the Add coin form one field at a time from two drawn Example photos ---- */
const DEMO_FILL = { typeId: "morgan-dollar", year: 1889, mint: "S", grade: "MS-63" };
function demoFillCard(d) {
  const ex = { year: DEMO_FILL.year, mint: DEMO_FILL.mint, denom: "$1", metal: "Silver" };
  const pics = (d._demoFill || 0) > 0 ? `<div class="btn-row" style="margin:6px 0"><img alt="Example photo of the front" width="64" height="64" src="${demoPic(ex, "front", true)}"><img alt="Example photo of the back" width="64" height="64" src="${demoPic(ex, "back", true)}"></div>` : "";
  return `<div class="card"><b>Photo fill (demo)</b>
    <div class="hint">In the real app, you take photos and the form fills itself in. Here is an example with drawn photos.</div>${pics}
    ${d._demoMsg ? `<div class="small" id="demoFillMsg">${esc(d._demoMsg)}</div>` : ""}
    <button type="button" class="btn block" data-act="demoFill" ${d._demoFill > 0 && d._demoFill < 5 ? "disabled" : ""}>See photo fill in action</button></div>`;
}
function demoFillRun() {
  if (!draft || !draft._isNew || draft._demoFill > 0 && draft._demoFill < 5) return;
  const d = draft;
  const steps = [
    ["Reading the photos…", () => {}],
    ["Found the coin type: Morgan Dollar.", () => pickType(DEMO_FILL.typeId)],
    ["Found the year: " + DEMO_FILL.year + ".", () => { d.year = DEMO_FILL.year; }],
    ["Found the mint mark: " + DEMO_FILL.mint + ".", () => { d.mint = DEMO_FILL.mint; }],
    ["Done. Check the fields below, then Save. (Example only: nothing is saved.)", () => { d.grade = DEMO_FILL.grade; }],
  ];
  let i = 0;
  const next = () => {
    if (draft !== d) return; // form closed
    d._demoFill = i + 1; d._demoMsg = steps[i][0];
    steps[i][1]();
    renderCoinForm();
    if (++i < steps.length) setTimeout(next, 900);
  };
  next();
}
