// Step 6b follow-up: Circulated switch on the Add/Edit coin form (no new saved field) and a More… button that shows every source.
const { chromium } = require("./_compat");
const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
(async () => {
  const b = await chromium.launch(); const errors = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(400);
  const ev = (f, a) => p.evaluate(f, a);
  await ev(() => { openCoinForm(); }); await p.waitForSelector("#coinForm");
  await ev(() => { pickType("kennedy-clad"); draft.year = 1990; renderCoinForm(); });
  ok("everyday coin: switch says Circulated (not graded)", /Circulated \(not graded\)/.test(await p.textContent("#coinForm")) && (await p.locator("[data-act=circTick]").count()) === 1);
  ok("More… is on the form and Coin roll hunting is hidden at first", (await p.locator("[data-act=srcChip][data-v=__more]").count()) === 1 && (await p.locator("[data-act=srcChip][data-v='Coin roll hunting']").count()) === 0);
  await p.click("[data-act=srcChip][data-v=__more]"); await p.waitForTimeout(100);
  ok("More… shows Coin roll hunting and the rest", (await p.locator("[data-act=srcChip][data-v='Coin roll hunting']").count()) === 1 && (await p.locator("[data-act=srcChip][data-v='Pocket change']").count()) === 1);
  await p.click("[data-act=srcChip][data-v='Coin roll hunting']"); await p.waitForTimeout(100);
  ok("Coin roll hunting fills Price paid with face", await ev(() => draft.source === "Coin roll hunting" && draft.paid === "0.5"));
  await p.click("[data-act=circTick]"); await p.waitForTimeout(100);
  ok("tick sets noGrade and keeps the chosen source", await ev(() => draft.noGrade === true && draft.source === "Coin roll hunting"));
  await ev(() => { draft.label = ""; }); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(300);
  const c = await ev(() => allCoins()[0]);
  ok("saved with noGrade, no grade, no extra field", c && c.noGrade === true && !c.grade && !Object.keys(c).some((k) => /^_|circ|srcMore/i.test(k)));
  ok("not missing grade or cost", await ev(() => missingOf(allCoins()[0]).length === 0));
  await ev(() => { openCoinForm(); }); await p.waitForSelector("#coinForm");
  await ev(() => { pickType("washington-silver"); draft.year = 1950; renderCoinForm(); });
  ok("silver coin keeps Can't grade this one, no Circulated switch", /Can't grade this one/.test(await p.textContent("#coinForm")) && (await p.locator("[data-act=circTick]").count()) === 0);
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
