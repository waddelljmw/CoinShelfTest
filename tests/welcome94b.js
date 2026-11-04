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
  ok("guide bubble on step 1 over the real form", await p.locator("#guideBubble").count() === 1 && /Step 1 of 7/.test(await p.locator("#guideBubble").innerText()) && await p.locator(".guide-hl").count() === 1);
  await p.click("[data-act=guideNext]"); await p.waitForTimeout(100);
  ok("Next moves the step", /Step 2 of 7/.test(await p.locator("#guideBubble").innerText()));
  await p.click("[data-act=guideSkip]"); await p.waitForTimeout(150);
  ok("Skip removes the guide, form stays", await p.locator("#guideBubble").count() === 0 && await p.locator("#coinForm, [data-act=what]").count() > 0);
  await p.evaluate(() => closeSheet());
  // saving moves the guide to the coin page
  await p.evaluate(() => { openCoinForm(null); guide = { step: 0 }; guideBubble(); const c = blankCoin(); Object.assign(c, { id: "g1", typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Morgan dollar", denom: "$1", metal: "Silver", year: 1881, mint: "S", grade: "MS-63" }); c.label = autoLabel(c); put("c_g1", c); closeSheet(); go("coin-g1"); });
  await p.waitForTimeout(400);
  ok("after saving, the guide shows the coin page steps", /Step 6 of 7/.test(await p.locator("#guideBubble").innerText()));
  await p.click("[data-act=guideNext]"); await p.waitForTimeout(100);
  ok("last step says where it is kept", /Where it's kept/.test(await p.locator("#guideBubble").innerText()));
  await p.click("[data-act=guideSkip]"); await p.waitForTimeout(100);
  ok("welcome is gone once a coin exists", await (async () => { await p.evaluate(() => go("home")); await p.waitForTimeout(200); return await p.locator(".welcome").count() === 0; })());
  // plain-words help: once per word, opens a sheet
  await p.evaluate(() => go("coin-g1")); await p.waitForTimeout(200);
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
