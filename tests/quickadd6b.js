// Step 6b Quick-add pocket change: no new grade, no new saved field (reuses noGrade); allowlist of everyday types;
// NIFC read-time tag; CSV words Not graded / Circulated; backup round trip; totals change by exactly face.
const { chromium } = require("./_compat");
const path = require("path"), fs = require("fs");
const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
const PAGE = "file://" + path.resolve(__dirname, "../index.html");
(async () => {
  const b = await chromium.launch(); const errors = [];
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(PAGE); await p.waitForTimeout(400);
  const ev = (f, a) => p.evaluate(f, a);
  const spots = await ev(() => {
    const mk = (t, y1, y2, id) => { const a = { kind: "album", id, brand: "Whitman", number: id, name: "", typeId: t, typeIds: [t], start: y1, end: y2, removed: [], createdAt: 1 }; a.slots = buildSlots(t, y1, y2); put("a_" + id, a); return withSlotIds(getAlbum(id)); };
    const out = {};
    const q = (a, y, m) => a.slots.find((s) => s.y === y && (s.m || "") === (m || "") && !s.v && !s.pf);
    const w = mk("washington-clad", 1965, 1970, "AW"), k = mk("kennedy-clad", 1971, 1990, "AK"), ks = mk("kennedy-40", 1965, 1970, "AK4");
    const sw = mk("washington-silver", 1950, 1952, "AS"), sh = mk("lincoln-shield", 2010, 2012, "ASH"), wh = mk("lincoln-wheat", 1950, 1952, "AWH"), sn = mk("shield-nickel", 1867, 1870, "ASN"), jn = mk("jefferson-nickel", 1940, 1950, "AJN");
    const ok1 = (a, y, m) => { const s = q(a, y, m); return s ? quickAddOk(a, s) : "nospot"; };
    out.clad = ok1(w, 1966, ""); out.kcl = ok1(k, 1985, ""); out.silverQ = ok1(sw, 1951, "D"); out.kenSilver = ks.slots.map((s) => quickAddOk(ks, s)).some(Boolean);
    out.shield = sh.slots.map((s) => quickAddOk(sh, s)).some((x) => x === false) ? "mixed" : "all"; out.wheat = wh.slots.map((s) => quickAddOk(wh, s)).some(Boolean);
    out.shieldNickel = sn.slots.map((s) => quickAddOk(sn, s)).some(Boolean); out.jeff1940 = ok1(jn, 1940, ""); out.jeff1946 = ok1(jn, 1946, "");
    out.shieldCent = sh.slots.some((s) => quickAddOk(sh, s));
    return out;
  });
  ok("clad quarter spot allowed", spots.clad === true && spots.kcl === true);
  ok("silver quarter spot still asks a grade", spots.silverQ === false);
  ok("40% silver Kennedy spots all ask a grade", spots.kenSilver === false);
  ok("Shield nickel spots ask a grade", spots.shieldNickel === false);
  ok("wheat cent spots ask a grade", spots.wheat === false);
  ok("Jefferson nickel allowed from 1946 only", spots.jeff1940 === false && spots.jeff1946 === true);
  ok("proof / S / W spots on modern clad are blocked", await ev(() => { const a = withSlotIds(getAlbum("AK")); const s = { y: 1985, m: "S" }; return quickAddOk(a, s) === false && quickAddOk(a, { y: 1996, m: "W" }) === false && quickAddOk(a, { y: 1985, m: "", pf: true }) === false && quickAddOk(a, { y: 1985, m: "", v: "Doubled die" }) === false; }));
  ok("mint-set spot blocked", await ev(() => quickAddOk(withSlotIds(getAlbum("AK")), { y: 1985, m: "", set: true }) === false));
  ok("key date blocked", await ev(() => { const a = withSlotIds(getAlbum("AW")); const hit = a.slots.filter((s) => keyDateInfo({ typeId: "washington-clad", year: s.y, mint: s.m })); return hit.length === 0 || hit.every((s) => !quickAddOk(a, s)); }));

  // Fill Spots saves Circulated as noGrade, no grade, face paid, and totals move by exactly face
  const t0 = await ev(() => Math.round(sum(countedCoins(), (c) => (bestEach(c) || 0) * qtyOf(c)) * 100));
  const made = await ev(() => {
    const a = withSlotIds(getAlbum("AK")); const sp = a.slots.filter((s) => quickAddOk(a, s)).slice(0, 4);
    const ids = sp.map((s, i) => { const c = fillCoin(a, s, "__circ", "", "", "Coin roll hunting", Date.now() + i); c.paid = moneyStr(TYPE_BY_ID[c.typeId].face); saveCoin(c); return c.id; });
    return ids;
  });
  const t1 = await ev(() => Math.round(sum(countedCoins(), (c) => (bestEach(c) || 0) * qtyOf(c)) * 100));
  ok("4 quick-added halves change the total by exactly face ($2.00)", t1 - t0 === 200);
  const c0 = await ev((id) => { const c = getCoin(id); return { g: c.grade, ng: c.noGrade, txt: gradeText(c), slot: slotGrade(c), miss: missingOf(c), src: c.source, keys: Object.keys(c).filter((k) => /circ/i.test(k)) }; }, made[0]);
  ok("no grade, noGrade flag, no new saved field", c0.g === "" && c0.ng === true && c0.keys.length === 0);
  ok("label says Circulated (not graded); album card shows it instead of owned", c0.txt.includes("Circulated (not graded)") && c0.slot === "Circulated (not graded)");
  ok("roll hunting coin is not missing cost or grade", c0.miss.length === 0);
  ok("Bank roll and Coin roll hunting skip the cost nag", await ev(() => ["Bank roll", "Coin roll hunting"].every((s) => !missingOf({ status: "owned", typeId: "roosevelt-clad", noGrade: true, source: s }).includes("cost"))));
  ok("Gift still $0 and Pocket change fills face on a new coin", await ev(() => { const mk = (src) => { const d = { ...blankCoin(), _isNew: true, typeId: "washington-clad", source: src, paid: "" }; autoPaid(d); return d.paid; }; return mk("Gift") === "0" && mk("Pocket change") === "0.25" && mk("Coin roll hunting") === "0.25" && mk("Bank roll") === "0.25" && mk("eBay") === ""; }));
  ok("Not graded (other source) says Not graded", await ev(() => noGradeWord({ source: "eBay" }) === "Not graded"));

  // NIFC
  const n = await ev(() => {
    const t = (typeId, year, mint, grade) => nifcOf({ typeId, year, mint, grade });
    return { d70: t("kennedy-40", 1970, "D"), p70: t("kennedy-40", 1970, ""), p87: t("kennedy-clad", 1987, ""), d87: t("kennedy-clad", 1987, "D"), y2002: t("kennedy-clad", 2002, "P"), y2020: t("kennedy-clad", 2020, "D"), y2021: t("kennedy-clad", 2021, "D"), y1988: t("kennedy-clad", 1988, ""), s2005: t("kennedy-clad", 2005, "S"),
      withGrade: gradeText({ ...blankCoin(), typeId: "kennedy-clad", year: 1987, mint: "D", grade: "MS-63", gradeMode: "raw" }), noGradeTxt: gradeText({ ...blankCoin(), typeId: "kennedy-clad", year: 2010, mint: "P", noGrade: true, source: "Coin roll hunting" }),
      slot: slotGrade({ ...blankCoin(), typeId: "kennedy-clad", year: 2010, mint: "P", grade: "MS-63" }), card: coinCardHtml({ typeId: "kennedy-clad", year: 2012, mint: "D" }, { spot: true }), card21: coinCardHtml({ typeId: "kennedy-clad", year: 2021, mint: "D" }, { spot: true }),
      quickNifc: (() => { const a = { kind: "album", id: "AN", typeId: "kennedy-clad", typeIds: ["kennedy-clad"], start: 2005, end: 2005 }; const s = { y: 2005, m: "D" }; return quickAddOk(a, s); })() };
  });
  ok("NIFC years: 1970-D, 1987-P/D, 2002-2020 P/D", n.d70 && n.p87 && n.d87 && n.y2002 && n.y2020 && !n.p70 && !n.y1988 && !n.s2005);
  ok("2021 is not tagged", n.y2021 === false && !/NIFC/.test(n.card21));
  ok("NIFC shows with a grade (MS-63 · NIFC)", /MS-63 · NIFC/.test(n.withGrade) && /MS-63 · NIFC/.test(n.slot));
  ok("NIFC shows without a grade", /Circulated \(not graded\) · NIFC/.test(n.noGradeTxt));
  ok("NIFC shows on the coin card", /NIFC/.test(n.card));
  ok("Quick-add stays allowed on NIFC spots", n.quickNifc === true);

  // Fill spots sheet: the Circulated choice only on allowed spots; saves noGrade with face paid and the remembered source
  await ev(() => { put("a_AU", { kind: "album", id: "AU", brand: "Whitman", number: "AU", name: "", typeId: "washington-clad", typeIds: ["washington-clad"], start: 1965, end: 1968, removed: [], createdAt: 2, slots: buildSlots("washington-clad", 1965, 1968) }); openFillAlbum("AU", false); });
  await p.waitForSelector("#fillForm");
  ok("Circulated choice is on the grade list", (await p.locator("#fillRows .fill-grade option[value=__circ]").count()) > 0);
  await p.click("[data-act=fillSrc][data-v=\"Coin roll hunting\"]");
  ok("one tap source button fills Where from", (await p.inputValue("#fillSource")) === "Coin roll hunting");
  await p.locator("#fillRows .fill-on").nth(0).check(); await p.locator("#fillRows .fill-grade").nth(0).selectOption("__circ");
  await p.click("[data-act=fillGo]"); await p.click("[data-act=fillGo]"); await p.waitForTimeout(400);
  const fc = await ev(() => allCoins().filter((c) => c.albumId === "AU")[0]);
  ok("Fill spots saves Circulated as noGrade, face paid, Coin roll hunting", fc && fc.noGrade === true && fc.grade === "" && fc.paid === "0.25" && fc.source === "Coin roll hunting");
  ok("last source is remembered", await ev(() => settings().lastFillSource === "Coin roll hunting"));

  // CSV round trip
  const csv = await ev((ids) => {
    const c1 = getCoin(ids[0]); const c2 = { ...c1, id: "ng2", source: "eBay", albumId: "", slotId: "" };
    const r1 = coinToRow(c1), r2 = coinToRow(c2);
    const b1 = rowToCoin((k) => r1[k]).coin, b2 = rowToCoin((k) => r2[k]).coin;
    const g = rowToCoin((k) => ({ ...r1, grade: "VF-20" })[k]).coin;
    return { g1: r1.grade, g2: r2.grade, ng1: b1.noGrade, gr1: b1.grade, cg1: b1.customGrade || "", ng2: b2.noGrade, gr2: b2.grade, cg2: b2.customGrade || "", realGrade: g.grade, realNg: !!g.noGrade };
  }, made);
  ok("CSV exports Circulated / Not graded", csv.g1 === "Circulated" && csv.g2 === "Not graded");
  ok("CSV import catches those words before parseGrade (no custom Other grade)", csv.ng1 && csv.ng2 && csv.gr1 === "" && csv.gr2 === "" && !csv.cg1 && !csv.cg2);
  ok("a real grade in CSV still imports as a grade", csv.realGrade === "VF-20" && !csv.realNg);

  // Filter chip
  const f = await ev(() => { listState.f = { ng: "1" }; const hit = allCoins().filter((c) => c.status === "owned" && extraFilter(c)); const r = { chips: fltChips().map((x) => x[1]), n: hit.length, allNg: hit.every((c) => !c.grade && c.noGrade) }; listState.f = {}; return r; });
  ok("Not graded filter chip appears and shows only not-graded coins", f.chips.includes("Not graded") && f.n === 5 && f.allNg);

  // Backup round trip into a second scratch copy: same coins, flag kept, totals equal
  const before = await ev(() => JSON.stringify({ n: sum(countedCoins(), qtyOf), t: Math.round(sum(countedCoins(), (c) => (bestEach(c) || 0) * qtyOf(c)) * 100), ng: allCoins().filter((c) => c.noGrade).length }));
  const bk = await ev(async () => buildBackup());
  fs.writeFileSync("/tmp/cc-6b-backup.json", JSON.stringify(bk));
  const q = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); q.on("pageerror", (e) => errors.push(e.message));
  await q.goto(PAGE); await q.waitForTimeout(400);
  await q.evaluate(() => openBackupSheet()); await q.waitForTimeout(100);
  await q.setInputFiles("#restoreFile", "/tmp/cc-6b-backup.json"); await q.waitForTimeout(300);
  if (await q.isVisible("[data-act=confirmOk]")) { await q.click("[data-act=confirmOk]"); await q.waitForTimeout(1000); }
  const after = await q.evaluate(() => JSON.stringify({ n: sum(countedCoins(), qtyOf), t: Math.round(sum(countedCoins(), (c) => (bestEach(c) || 0) * qtyOf(c)) * 100), ng: allCoins().filter((c) => c.noGrade).length }));
  ok("backup round trip: same count, totals and noGrade coins", before === after && JSON.parse(after).ng === 5);
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
