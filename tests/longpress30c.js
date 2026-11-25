// Step 30c: long-press a coin or filled album spot starts Select with it ticked.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); const p = await ctx.newPage();
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  await p.evaluate(() => {
    put("a_al1", { ...(typeof blankAlbum === "function" ? blankAlbum() : {}), id: "al1", typeId: "morgan-dollar", name: "Morgans", slots: [{ y: 1880, m: "S", v: "" }] }, true);
    ["g1", "g2", "g3"].forEach((id) => put("c_" + id, { ...blankCoin(), id, typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, mint: "S", status: "owned", qty: 1, albumId: id === "g1" ? "al1" : "" }, true));
    listState.family = null; listState.status = "owned"; go("coins");
  });
  await p.waitForTimeout(250);
  const cdp = await ctx.newCDPSession(p);
  const hold = async (sel, ms, dy = 0) => {
    const el = p.locator(sel).first(); await el.scrollIntoViewIfNeeded(); const r = await el.boundingBox();
    const x = r.x + r.width / 2, y = r.y + r.height / 2;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    if (dy) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y + dy }] });
    await p.waitForTimeout(ms);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await p.waitForTimeout(250);
  };
  const sel = () => p.evaluate(() => (listState.sel ? [...listState.sel].sort().join() : null));
  await hold('[data-go="coin-g2"]', 800);
  ok("My Coins: long-press turns Select on with it ticked", (await sel()) === "g2");
  ok("stays on My Coins", (await p.evaluate(() => location.hash)) === "#coins");
  await p.tap('[data-act=selToggle][data-id="g3"]'); await p.waitForTimeout(150);
  ok("next tap adds another", (await sel()) === "g2,g3");
  await p.click("[data-act=selDone]");
  await hold('[data-go="coin-g2"]', 800, 40);
  ok("a moving finger (scroll) does not select", (await sel()) === null);
  await p.evaluate(() => go("coins")); await p.waitForTimeout(250);
  await hold('[data-go="coin-g2"]', 100); 
  ok("a short tap still opens the coin", (await p.evaluate(() => location.hash)) === "#coin-g2" && (await sel()) === null);
  await p.evaluate(() => go("album-al1")); await p.waitForTimeout(250);
  await hold(".slot.have[data-coin=g1]", 800);
  ok("album spot: long-press selects, no spot menu", (await sel()) === "g1" && !(await p.locator("#sheet [data-act=slotTakeOut]").isVisible()));
  await p.evaluate(() => { listState.sel = null; go("home"); }); await p.waitForTimeout(250);
  ok("no page errors", !errors.length);
  await b.close();
})();
