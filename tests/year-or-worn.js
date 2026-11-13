// N2 (E + 77, v0.64.0): new coins need a year or the "too worn" tick; type the year first and the type list narrows.
const { chromium } = require("./_compat");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "..");
const srv = http.createServer((q, r) => {
  const u = q.url.split("?")[0];
  fs.readFile(path.join(root, u === "/" ? "index.html" : u), (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.end(d); });
}).listen(8791);
(async () => {
  const b = await chromium.launch();
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const errors = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route("**/api.gold-api.com/**", (r) => r.abort());
  const p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://localhost:8791/"); await p.waitForFunction(() => store.mode === "local", null, { timeout: 15000 });
  const n = () => p.evaluate(() => allCoins().filter((c) => c.status !== "deleted").length);
  // old coin with no year still saves and edits freely (not asked, not changed)
  await p.evaluate(() => saveCoin({ ...blankCoin(), id: "old1", typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Morgan dollar", denom: "$1", year: "", grade: "VF-20", photos: [] }));
  await p.evaluate(() => { openCoinForm("old1"); });
  await p.waitForSelector("#coinForm"); await p.fill("[data-f=notes]", "still saves").catch(() => {});
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(400);
  ok("old coin with no year saves unchanged", await p.evaluate(() => { const c = getCoin("old1"); return c && c.year === "" && !c.noDate; }));
  if (await p.isVisible("#coinForm")) await p.click(".sheet-head [data-act=closeSheet]");
  const before = await n();
  // new coin with neither: stopped
  await p.click("#fab"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(300);
  ok("new coin with no year and no tick is stopped", (await n()) === before && await p.isVisible("#coinForm"));
  ok("tick is offered while the year is empty", await p.isVisible("#wornRow"));
  // tick saves noDate worn
  await p.check("[data-fcheck=_worn]"); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(400);
  ok("ticked coin saves with noDate worn", (await n()) === before + 1 && await p.evaluate(() => allCoins().some((c) => c.noDate === "worn" && c.year === "")));
  // year plus tick keeps the year, no noDate
  await p.click("#fab"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.check("[data-fcheck=_worn]"); await p.fill("[data-f=year]", "1881");
  ok("tick hides once a year is typed", !(await p.isVisible("#wornRow")));
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(400);
  ok("year wins over the tick", await p.evaluate(() => allCoins().some((c) => c.year === 1881 && !c.noDate)));
  // year first narrows the type list
  await p.click("#fab"); ok("Year box comes before the type search", await p.evaluate(() => { const y = document.querySelector("[data-f=year]"), t = document.querySelector("#typeSearch"); return !!(y && t && (y.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING)); }));
  await p.fill("[data-f=year]", "1925"); await p.fill("#typeSearch", "");
  await p.focus("#typeSearch"); await p.waitForTimeout(100);
  const l1925 = await p.evaluate(() => [...document.querySelectorAll("#typeList button")].map((x) => x.textContent));
  ok("1925 list has Peace dollar, not Morgan dollar or Kennedy half", l1925.some((x) => /Peace/.test(x)) && !l1925.some((x) => /Morgan/.test(x)) && !l1925.some((x) => /Kennedy/.test(x)));
  ok("no page errors", !errors.length);
  await b.close(); srv.close();
})();
