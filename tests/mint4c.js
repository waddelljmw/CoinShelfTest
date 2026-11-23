// Step 4c: mint "Can't tell", "Pick a mint" for new coins in years with more than one mint, No mint mark picked on purpose (mintOk),
// old blank coins unchanged, and the Home "Fix them" button starting the Needs Attention run.
const { chromium } = require("./_compat");
const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
(async () => {
  const b = await chromium.launch(); const errors = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(400);
  const ev = (f, a) => p.evaluate(f, a);
  const r = await ev(() => {
    const base = { status: "owned", itemKind: "coin", typeId: "lincoln-wheat", year: 1944, mint: "", grade: "G-4", paid: "1", source: "Coin Shop" };
    const mk = (o) => ({ ...base, ...o }), flag = (o) => needsOf(mk(o)).includes("check mint");
    return { old: flag({}), ok: flag({ mintOk: true }), cant: flag({ mint: "?" }), d: flag({ mint: "D" }),
      label: autoLabel(mk({ mint: "?", typeName: "Wheat Cent", denom: "1C" })), base: bookBase(mk({ mint: "?" }), "circ"), mintage: recordMintage(mk({ mint: "?" })) };
  });
  ok("old blank coin in a mixed year still flagged", r.old);
  ok("No mint mark on purpose, Can't tell and D clear the flag", !r.ok && !r.cant && !r.d);
  ok("Can't tell label and value key", /^1944 \(mint\?\)/.test(r.label) && r.base === "1944");
  ok("Can't tell shows no mintage", r.mintage == null);
  // New coin: mixed year starts at Pick a mint; single-mint year reads No mint mark.
  await ev(() => { openCoinForm(); }); await p.waitForSelector("#coinForm");
  await ev(() => { pickType("lincoln-wheat"); draft.year = 1944; renderCoinForm(); });
  ok("1944 wheat cent starts at Pick a mint", await p.$eval("select[data-f=mint]", (e) => e.value === "" && /Can't tell/.test(e.textContent) && /No mint mark/.test(e.textContent)));
  await p.selectOption("select[data-f=mint]", "-"); await p.waitForTimeout(80);
  ok("No mint mark sets a blank mint plus mintOk", await ev(() => draft.mint === "" && draft.mintOk === true));
  await ev(() => { draft.label = ""; draft.paid = "1"; draft.source = "Coin Shop"; draft.grade = "G-4"; }); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(300);
  ok("saved No mint mark coin isn't flagged", await ev(() => { const c = allCoins()[0]; return c && c.mint === "" && c.mintOk === true && !needsOf(c).includes("check mint"); }));
  await ev(() => { openCoinForm(); }); await p.waitForSelector("#coinForm");
  await ev(() => { pickType("lincoln-wheat"); draft.year = 1944; renderCoinForm(); });
  await p.selectOption("select[data-f=mint]", "?"); await p.waitForTimeout(80);
  await ev(() => { draft.label = ""; draft.paid = "1"; draft.source = "Coin Shop"; draft.grade = "G-4"; }); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(300);
  ok("Can't tell saves as ? without mintOk", await ev(() => { const c = allCoins().find((x) => x.mint === "?"); return c && !("mintOk" in c) && !needsOf(c).includes("check mint"); }));
  await ev(() => { openCoinForm(); }); await p.waitForSelector("#coinForm");
  await ev(() => { pickType("lincoln-wheat"); draft.year = 1909; renderCoinForm(); });
  const single = await ev(() => { const hit = EXACT_SLOTS["lincoln-wheat"].find((s) => s[0] === 1909); return hit[1].split(" ").every((m) => m === "P"); });
  if (single) ok("Philadelphia-only year reads No mint mark", await p.$eval("select[data-f=mint]", (e) => e.value === "-"));
  await ev(() => { draft.year = 1944; refreshFormHints(); });
  ok("changing the year to a mixed year switches to Pick a mint", await p.$eval("select[data-f=mint]", (e) => e.value === ""));
  await p.selectOption("select[data-f=mint]", "D"); await p.waitForTimeout(80);
  ok("picking D drops mintOk", await ev(() => draft.mint === "D" && !draft.mintOk));
  await ev(() => closeSheet());
  // An old blank coin opens at Pick a mint and stays unchanged until picked; CSV round trip keeps Can't tell and None.
  await ev(async () => { await saveCoin({ ...blankCoin(), id: "old1", typeId: "lincoln-wheat", typeName: "Wheat Cent", denom: "1C", year: 1944, mint: "", grade: "G-4", paid: "1", source: "Coin Shop" }); render(); });
  ok("old coin keeps a plain blank mint", await ev(() => { const c = getCoin("old1"); return c.mint === "" && !("mintOk" in c); }));
  const rows = await ev(() => { const a = parseMint("Can't tell"), n = parseMint("None"); return { a, n }; });
  ok("CSV reads Can't tell and None", rows.a === "?" && rows.n === "");
  // Home button starts the Needs Attention run.
  await ev(() => go("home")); await p.waitForTimeout(250);
  ok("Home shows the Fix them button", /Fix them/.test(await p.textContent(".need-line")));
  await p.click(".need-line"); await p.waitForTimeout(300);
  ok("tapping it opens a coin in the Needs Attention run", await ev(() => fixup.on && !!document.querySelector("#coinForm")) && /Pick the mint: No mint mark/.test(await p.textContent("#sheet")));
  // 4-box check: backup and restore into a fresh copy keeps every mint answer, the coin count and the totals.
  const measure = (pg) => pg.evaluate(() => { const o = countedCoins(); return JSON.stringify({ n: allCoins().filter((c) => c.status !== "deleted").length, q: sum(o, qtyOf), t: Math.round(sum(o, (c) => (bestEach(c) || 0) * qtyOf(c)) * 1e4), mints: allCoins().map((c) => c.id + ":" + c.mint + ":" + (c.mintOk ? 1 : 0)).sort().join(","), need: needInfoCoins().length }); });
  await ev(() => actions.fixupStop());
  const before = await measure(p), bk = await ev(async () => buildBackup());
  require("fs").writeFileSync("/tmp/cc-4c-backup.json", JSON.stringify(bk));
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 } }); const q = await ctx2.newPage(); q.on("pageerror", (e) => errors.push(e.message));
  await q.goto("file://" + require("path").resolve(__dirname, "../index.html")); await q.waitForTimeout(400);
  await q.evaluate(() => openBackupSheet()); await q.waitForTimeout(100);
  await q.setInputFiles("#restoreFile", "/tmp/cc-4c-backup.json"); await q.waitForTimeout(300);
  if (await q.isVisible("[data-act=confirmOk]")) { await q.click("[data-act=confirmOk]"); await q.waitForTimeout(1000); }
  const after = await measure(q);
  ok("backup and restore keep mints, count, totals and needs-attention count", after === before && /:\?:0/.test(after) && /:1/.test(after));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
