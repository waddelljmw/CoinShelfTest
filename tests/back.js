const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => {
    const a = { kind: "album", id: "alb1", brand: "Dansco", number: "7178", name: "", typeId: "peace-dollar", start: 1921, end: 1935, removed: [], createdAt: 1 };
    a.slots = buildSlots("peace-dollar", 1921, 1935); put("a_alb1", a);
    saveCoin({ ...blankCoin(), id: "own1", typeId: "peace-dollar", typeName: "Peace Dollar", family: "Peace dollar", denom: "$1", year: 1922, mint: "", grade: "AU-50", albumId: "alb1" });
  });
  const back = async () => (await p.textContent("main .link-btn")).trim();
  // album → coin → back
  await p.evaluate(() => go("album-alb1")); await p.waitForTimeout(150);
  await p.click(".slot.have"); await p.click(".sheet [data-go^=coin-]"); await p.waitForTimeout(200);
  console.log("from album:", await back());
  await p.click("main .link-btn"); await p.waitForTimeout(200);
  console.log("  went to:", await p.evaluate(() => location.hash), "| sheet closed:", await p.evaluate(() => document.getElementById("sheet").hidden));
  // home → coin → back
  await p.click(".brand"); await p.waitForTimeout(150); await p.click(".coin-row"); await p.waitForTimeout(200);
  console.log("from home:", await back()); await p.click("main .link-btn"); await p.waitForTimeout(150); console.log("  went to:", await p.evaluate(() => location.hash));
  // your coins → coin → edit (stays on coin) → back
  await p.click("#menuBtn"); await p.click("#menu [data-go=coins]"); await p.click(".coin-row"); await p.waitForTimeout(200);
  await p.click("[data-act=edit]"); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200);
  console.log("from coins after edit:", await back());
  // new coin added from album menu → lands on coin → back goes to album
  await p.evaluate(() => go("album-alb1")); await p.waitForTimeout(150);
  await p.click(".slot:has-text('1923-D')"); await p.click("[data-act=slotHave]"); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(250);
  console.log("after adding from album:", await back());
  // opened directly (no history)
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html") + "#coin-own1"); await p.waitForTimeout(300);
  console.log("direct link:", await back());
  console.log("errors", errors); await b.close();
})();
