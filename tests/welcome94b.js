// Step 9.4b: welcome card, optional guided first coin (skip + replay), plain-words help.
const { chromium } = require("./_compat");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "..");
const srv = http.createServer((q, r) => {
  const u = q.url.split("?")[0];
  fs.readFile(path.join(root, u === "/" ? "index.html" : u), (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.end(d); });
}).listen(8797);
(async () => {
  const b = await chromium.launch();
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const errors = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route("**/api.gold-api.com/**", (r) => r.abort());
  const p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://localhost:8797/"); await p.waitForFunction(() => store.mode === "local", null, { timeout: 15000 }); await p.waitForTimeout(300);
  ok("welcome shows with no coins", await p.locator(".welcome [data-act=startCollection]").count() === 1 && await p.locator(".welcome [data-act=tryDemo]").count() === 1);
  ok("every plain word has a meaning", await p.evaluate(() => Object.values(WORDS).every((w) => w[0] && w[1].length > 20)));
  // guide: ask, start, skip
  await p.click("[data-act=startCollection]"); await p.waitForTimeout(150);
  ok("asks Show me how or Skip", await p.locator("[data-act=guideStart]").count() === 1 && await p.locator("[data-act=guideNoThanks]").count() === 1);
  await p.click("[data-act=guideStart]"); await p.waitForTimeout(400);
  const bub = () => p.locator("#guideBubble").innerText();
  const apart = () => p.evaluate(() => { const b = document.getElementById("guideBubble").getBoundingClientRect(), t = document.querySelector(".guide-hl").getBoundingClientRect(); return b.bottom <= t.top + 1 || b.top >= t.bottom - 1; });
  ok("step 1 points at the type search, bubble not on top of it", /Step 2 of 8/.test(await bub()) && await p.locator("#typeSearch.guide-hl").count() === 1 && await apart());
  await p.fill("#typeSearch", "Morgan"); await p.waitForTimeout(300);
  await p.click("[data-act=pickType]"); await p.waitForTimeout(500);
  ok("picking the type moves to the year", /Step 3 of 8/.test(await bub()) && await p.locator("[data-f=year].guide-hl").count() === 1 && await apart());
  await p.fill("[data-f=year]", "1881"); await p.waitForTimeout(200);
  ok("typing waits for Next (no jumping)", /Step 3 of 8/.test(await bub()));
  await p.click("[data-act=guideNext]"); await p.waitForTimeout(300);
  ok("grade step points at the grade box", /Step 4 of 8/.test(await bub()) && await p.locator("[data-f=grade].guide-hl").count() === 1 && await apart());
  await p.selectOption("[data-f=grade]", { index: 3 }); await p.waitForTimeout(500);
  ok("choosing a grade moves to cost", /Step 5 of 8/.test(await bub()) && await p.locator("[data-f=paid].guide-hl").count() === 1);
  await p.fill("[data-f=paid]", "40"); await p.click("[data-act=guideNext]"); await p.waitForTimeout(300);
  ok("Save step points at the Add coin button", /Step 6 of 8/.test(await bub()) && await p.locator("#coinForm button[type=submit].guide-hl").count() === 1);
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(800);
  ok("saving a real coin moves the guide to the coin page", /Step 7 of 8/.test(await bub()) && /^#coin-/.test(await p.evaluate(() => location.hash)));
  await p.click("[data-act=guideNext]"); await p.waitForTimeout(100);
  ok("last step says where it is kept", /Where it's kept/.test(await bub()));
  await p.click("[data-act=guideSkip]"); await p.waitForTimeout(100);
  ok("Skip removes the guide", await p.locator("#guideBubble").count() === 0);
  ok("welcome is gone once a coin exists", await (async () => { await p.evaluate(() => go("home")); await p.waitForTimeout(200); return await p.locator(".welcome").count() === 0; })());
  // plain-words help: once per word, opens a sheet
  await p.evaluate(() => go("coin-" + allCoins()[0].id)); await p.waitForTimeout(200);
  ok("Melt has one ⓘ on the coin page", await p.locator("[data-w=melt]").count() === 1);
  await p.click("[data-w=melt]"); await p.waitForTimeout(150);
  ok("tapping ⓘ shows the plain meaning", /metal in a coin/.test(await p.locator("#sheet").innerText()));
  await p.evaluate(() => closeSheet());
  // replay from Options
  await p.evaluate(() => go("options")); await p.waitForTimeout(200);
  ok("Options can replay the guide", await p.locator("[data-act=guideStart]").count() === 1);
  ok("no page errors", errors.length === 0);
  if (errors.length) console.log(errors.join("\n"));
  await b.close(); srv.close();
})();
