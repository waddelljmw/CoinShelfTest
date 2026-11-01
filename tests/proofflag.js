const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const opts = (sel) => p.evaluate((s) => [...document.querySelectorAll(s + " option")].map((o) => o.value), sel);
  await p.click("#fab"); await p.fill("#typeSearch", "silver eagle"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.fill("[data-f=year]", "2019"); await p.waitForTimeout(80);
  let m = await opts("[data-f=mint]"), g = await opts("[data-f=grade]");
  ok("regular Silver Eagle: W offered (burnished), no PR grades", m.includes("W") && !g.some((x) => x.startsWith("PR-")));
  await p.check("[data-act=toggleProof]"); await p.waitForTimeout(100);
  m = await opts("[data-f=mint]"); g = await opts("[data-f=grade]");
  ok("proof Silver Eagle: W, S and no-mark offered; only PR grades", m.includes("W") && m.includes("S") && g.filter((x) => x && x !== "Other").every((x) => x.startsWith("PR-")));
  await p.selectOption("[data-f=mint]", "W"); await p.selectOption("[data-f=grade]", "PR-70"); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200);
  ok("saved as a W proof", await p.evaluate(() => { const c = allCoins()[0]; return c.mint === "W" && c.grade === "PR-70" && !("_proof" in c); }));
  // Washington silver: proofs are Philadelphia only (no W, no S)
  await p.evaluate(() => closeSheet()); await p.click("#fab"); await p.fill("#typeSearch", "washington quarter (silver)"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.check("[data-act=toggleProof]"); await p.waitForTimeout(80);
  m = await opts("[data-f=mint]");
  ok("silver Washington proof: no mint mark only", m.join() === "");
  await p.uncheck("[data-act=toggleProof]"); await p.waitForTimeout(80);
  m = await opts("[data-f=mint]");
  ok("silver Washington regular: P D S, no W", m.includes("D") && m.includes("S") && !m.includes("W"));
  // ATB quarter regular includes W (2019–2020 circulation)
  await p.evaluate(() => closeSheet()); await p.click("#fab"); await p.fill("#typeSearch", "america the beautiful"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  m = await opts("[data-f=mint]");
  ok("ATB quarter regular includes W", m.includes("W"));
  await p.check("[data-act=toggleProof]"); await p.waitForTimeout(80); m = await opts("[data-f=mint]");
  ok("ATB quarter proof: S only", m.join() === ",S");
  // turning proof off clears a PR grade and a proof-only mint
  await p.selectOption("[data-f=mint]", "S"); await p.selectOption("[data-f=grade]", "PR-69");
  await p.uncheck("[data-act=toggleProof]"); await p.waitForTimeout(80);
  ok("unticking proof clears PR grade", await p.evaluate(() => draft.grade === ""));
  // editing an existing proof coin shows Proof ticked
  await p.evaluate(() => { closeSheet(); openCoinForm(allCoins()[0].id); }); await p.waitForTimeout(100);
  ok("existing PR coin opens with Proof ticked", await p.isChecked("[data-act=toggleProof]"));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
