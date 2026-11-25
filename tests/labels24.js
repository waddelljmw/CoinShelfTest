// Step 24 Labels: Described as (97), + on slab grades, Keeping for (137), Plated/Colorized problems (150). Plus the 4-box check.
const { chromium } = require("./_compat");
const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
(async () => {
  const b = await chromium.launch(); const errors = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(400);
  const ev = (f, a) => p.evaluate(f, a);

  // An old coin (made before this step) and the totals before anything new is saved.
  const before = await ev(() => {
    const c = blankCoin(); Object.assign(c, { typeId: "morgan", typeName: "Morgan Dollar", year: 1881, mint: "S", gradeMode: "cert", service: "PCGS", grade: "MS-64", paid: "60" }); put("c_" + c.id, c);
    window._oldId = c.id; window._oldJson = JSON.stringify(c);
    return { n: allCoins().filter((x) => x.status !== "deleted").length, val: bestEach(c), txt: gradeText(c) };
  });

  // Form: Described as + Plus on a slab
  await ev(() => openCoinForm(window._oldId)); await p.waitForSelector("#coinForm");
  const t = await p.textContent("#coinForm");
  ok("form has Described as, Plus (slab) and Keeping for", /Described as/.test(t) && /Plus \(\+\) on the label/.test(t) && /Keeping for/.test(t));
  ok("section renamed and Plated / Colorized listed", /Errors, problems and changes/.test(t) && /Plated/.test(t) && /Colorized/.test(t));
  await p.selectOption("select[data-f=described]", "UNC"); await p.waitForTimeout(100);
  await p.click("[data-fcheck=plus]");
  await ev(() => { draft.keepFor = "  my son "; });
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(300);
  const c1 = await ev(() => getCoin(window._oldId));
  ok("saved: described UNC, plus, keepFor trimmed", c1.described === "UNC" && c1.plus === true && c1.keepFor === "my son");
  ok("grade unchanged, value unchanged, label shows MS-64+", await ev((v) => { const c = getCoin(window._oldId); return c.grade === "MS-64" && bestEach(c) === v && /MS-64\+/.test(gradeText(c)); }, before.val));

  // Own words
  await ev(() => openCoinForm(window._oldId)); await p.waitForSelector("#coinForm");
  await p.selectOption("select[data-f=described]", "__own"); await p.waitForTimeout(100);
  await p.fill("input[data-f=described]", "Gem BU"); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(300);
  ok("own words saved", await ev(() => getCoin(window._oldId).described === "Gem BU"));

  // Locked: For sale blocked, Mark as sold asks first, counts in totals
  ok("Keeping for coin can't be put For sale", await ev(() => { putForSale(window._oldId, true); return stageOf(getCoin(window._oldId)) !== "forsale"; }));
  ok("still counted in totals", await ev(() => isCounted(getCoin(window._oldId))));
  await ev(() => actions.sell({ dataset: { id: window._oldId } })); await p.waitForTimeout(200);
  ok("Mark as sold asks first", /keeping for my son/i.test(await p.textContent("#sheet")));
  await ev(() => closeSheet());

  // Filter
  ok("filter Keeping for finds it", await ev(() => { listState.f = { kf: "my son" }; const a = extraFilter(getCoin(window._oldId)); listState.f = { kf: "nephew" }; const b = extraFilter(getCoin(window._oldId)); listState.f = {}; return a && !b; }));

  // Clearing removes the boxes; raw coin drops the plus
  await ev(() => openCoinForm(window._oldId)); await p.waitForSelector("#coinForm");
  await p.selectOption("select[data-f=described]", ""); await p.waitForTimeout(100);
  await ev(() => { draft.keepFor = ""; draft.gradeMode = "raw"; });
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(300);
  ok("cleared boxes are not saved", await ev(() => { const c = getCoin(window._oldId); return !("described" in c) && !("keepFor" in c) && !("plus" in c); }));

  // Plated makes a Details coin (no book value)
  ok("Plated is a problem (Details)", await ev(() => { const c = { ...getCoin(window._oldId), problems: ["Plated"] }; return hasProblems(c) && /Details/.test(gradeText(c)); }));

  // 4-box check: backup keeps the new boxes; restore puts them back; count unchanged
  const bk = await ev(async () => {
    const c = getCoin(window._oldId); Object.assign(c, { gradeMode: "cert", described: "BU", plus: true, keepFor: "nephew" }); put("c_" + c.id, c);
    const data = await buildBackup(); const d = data.docs.find((x) => x.id === "c_" + c.id).data;
    const merged = mergeRestored("c_" + c.id, JSON.parse(JSON.stringify(d)));
    return { inBackup: d.described === "BU" && d.plus === true && d.keepFor === "nephew", restored: merged.described === "BU" && merged.keepFor === "nephew" && merged.plus === true, dv: data.dataVersion, n: allCoins().filter((x) => x.status !== "deleted").length };
  });
  ok("backup carries the new boxes", bk.inBackup);
  ok("restore keeps them", bk.restored);
  ok("data version unchanged (no conversion needed)", bk.dv === 1);
  ok("coin count same before and after", bk.n === before.n);
  ok("old coin without the boxes still reads the same", await ev(() => { const c = JSON.parse(window._oldJson); return !isKeptFor(c) && !noSell(c) && gradeText(c) === "PCGS MS-64"; }));

  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
