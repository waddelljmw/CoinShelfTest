// Step 4a (v0.82.0): look up any coin from the Coins search box; card, want list, eBay.
const { chromium } = require("./_compat");
const path = require("path");
const ok = (name, v) => { console.log((v ? "PASS " : "FAIL ") + name); if (!v) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + path.resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const r = await p.evaluate(() => ({
    a: lookupMatches("1916-D dime").map((x) => x.typeId + x.year + x.mint),
    b: lookupMatches("1916 d mercury").length, none: lookupMatches("dime").length, future: lookupMatches("2999 dime").length,
    vdb: lookupMatches("1909 vdb").length, bad: lookupMatches("1916-O mercury").length, noMint: lookupMatches("1916 mercury").length,
  }));
  ok("1916-D dime finds the Mercury dime", r.a.includes("mercury-dime1916D"));
  ok("mint typed with a space works", r.b === 1);
  ok("no year, no lookup; future year none", r.none === 0 && r.future === 0);
  ok("nickname search works (vdb)", r.vdb >= 1);
  ok("wrong mint (1916-O) gives no row", r.bad === 0);
  ok("no mint typed lists each mint struck", r.noMint >= 2);
  await p.evaluate(() => { listState.q = "1916-D dime"; go("coins"); }); await p.waitForTimeout(300);
  ok("row shows under the search box", /Not owned\? Tap to see it/.test(await p.evaluate(() => document.body.innerText)));
  const rowTxt = await p.evaluate(() => document.querySelector('[data-act="lookupOpen"]').closest(".rowline").innerText);
  ok("row: Key date first, then name and mintage", /^Key date/.test(rowTxt.trim()) && /1916-D Mercury Dime/.test(rowTxt) && /264,000/.test(rowTxt));
  ok("empty message says Not in your coins", /Not in your coins\./.test(await p.evaluate(() => document.body.innerText)));
  ok("search box says Search your coins", (await p.evaluate(() => $("#coinSearch").placeholder)) === "Search your coins");
  await p.click('.rowline .info-btn'); await p.waitForTimeout(200);
  ok("tapping the info mark explains the key date rule", /own rule, not anyone/.test(await p.evaluate(() => document.body.innerText)));
  await p.evaluate(() => closeSheet());
  await p.click('[data-act="lookupOpen"]'); await p.waitForTimeout(300);
  const txt = await p.evaluate(() => document.body.innerText);
  ok("card: key date, mintage, melt, you don't own, eBay, want button", /Key date/.test(txt) && /Mintage/.test(txt) && /Silver: 0\.072 oz/.test(txt) && /You don't own this one yet/.test(txt) && /Search eBay sold/.test(txt) && /Add to want list/.test(txt));
  const href = await p.evaluate(() => [...document.querySelectorAll("a")].find((a) => /Search eBay sold/.test(a.textContent)).href);
  ok("eBay link is a sold search", /ebay\.com.*LH_Sold=1/.test(href) && /1916/.test(href));
  await p.click('[data-act="lookupWant"]'); await p.waitForTimeout(300);
  const w = await p.evaluate(() => wants().filter((x) => x.typeId === "mercury-dime" && x.year === 1916 && x.mint === "D").length);
  ok("added to the want list once", w === 1);
  await p.evaluate(() => { openSheet("x"); }); await p.evaluate(() => { closeSheet(); lookupOpen({ dataset: { t: "mercury-dime", y: "1916", m: "D" } }); }); await p.waitForTimeout(200);
  ok("second time says already on want list", /Already on your want list/.test(await p.evaluate(() => document.body.innerText)));
  await p.evaluate(() => { closeSheet(); listState.q = ""; go("home"); }); await p.waitForTimeout(300);
  ok("Home has a Search any coin box", (await p.evaluate(() => (document.querySelector("#homeSearch") || {}).placeholder)) === "Search any coin");
  await p.click("#homeSearch"); await p.keyboard.type("1916 dime", { delay: 20 }); await p.waitForTimeout(400);
  const hs = await p.evaluate(() => ({ hash: location.hash, q: $("#coinSearch") && $("#coinSearch").value, focus: document.activeElement && document.activeElement.id }));
  ok("typing on Home lands on Coins with the words and keeps typing", hs.hash === "#coins" && hs.q === "1916 dime" && hs.focus === "coinSearch");
  ok("no page errors", errors.length === 0);
  await b.close();
})();
