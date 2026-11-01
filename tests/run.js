const { chromium } = require("./_compat");
const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await p.goto("file://" + path.resolve(__dirname, "../index.html"));
  const shot = (n) => p.screenshot({ path: `/tmp/${n}.png`, fullPage: true });
  await shot("01-home-empty");

  // Spot prices
  await p.click("#menuBtn"); await p.click("#menu [data-go=options]");
  await p.fill("[data-spot=gold]", "2650"); await p.fill("[data-spot=silver]", "31.50");
  await p.fill("[data-spot=copper]", "4.30");
  await p.waitForTimeout(900);

  async function addCoin(f) {
    await p.click("#fab");
    await p.fill("#typeSearch", f.type);
    await p.click("#typeList button >> nth=0");
    await p.fill("[data-f=year]", String(f.year));
    if (f.mint != null) await p.selectOption("[data-f=mint]", f.mint);
    if (f.cert) { await p.click("[data-act=gmode][data-v=cert]"); await p.selectOption("[data-f=service]", f.service); await p.fill("[data-f=cert]", "12345678"); }
    await p.selectOption("[data-f=grade]", f.grade);
    if (f.qty) await p.fill("[data-f=qty]", String(f.qty));
    if (f.paid) await p.fill("[data-f=paid]", String(f.paid));
    if (f.value && f.grade !== "Junk") await p.fill("[data-f=value]", String(f.value));
    if (f.source) { await p.selectOption('[data-f="_sourceKind"]', f.source).catch(async () => { await p.selectOption('[data-f="_sourceKind"]', "Other"); await p.fill('[data-f="source"]', f.source); }); }
    if (f.album) { await p.selectOption("[data-f=albumId]", f.album.sel); if (f.album.number) { await p.selectOption("[data-na=brand]", f.album.brand); await p.fill("[data-na=number]", f.album.number); } }
    if (f.shot) await shot(f.shot);
    await p.click("#coinForm button[type=submit]");
    await p.waitForTimeout(150);
  }
  await addCoin({ type: "morgan", year: 1921, mint: "D", grade: "VF-20", paid: 40, value: 55, source: "Coin shop", album: { sel: "__new", brand: "Whitman", number: "9128" }, shot: "02-form" });
  const albumId = await p.evaluate(() => [...document.querySelectorAll("[data-f]")].length); // noop
  await shot("03-coin-detail");
  // second morgan into same album
  await p.click("#fab"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button >> nth=0");
  await p.fill("[data-f=year]", "1881"); await p.selectOption("[data-f=mint]", "S");
  await p.click("[data-act=gmode][data-v=cert]"); await p.selectOption("[data-f=grade]", "MS-63");
  await p.fill("[data-f=value]", "120"); await p.fill("[data-f=paid]", "90");
  const opts = await p.$$eval("[data-f=albumId] option", (o) => o.map((x) => x.textContent));
  console.log("album options", opts);
  await p.selectOption("[data-f=albumId]", { index: 1 });
  await p.click("#coinForm button[type=submit]");
  await addCoin({ type: "kennedy 40", year: 1967, mint: "", grade: "Junk", qty: 4, source: "Inherited" });
  await addCoin({ type: "wheat", year: 1944, mint: "D", grade: "F-12", qty: 20, value: 0.10, paid: 0.05 });
  await addCoin({ type: "silver eagle", year: 2023, mint: "", grade: "MS-69", cert: true, service: "NGC", value: 45, paid: 42 });

  await p.click("[data-go=home] >> nth=0"); await p.waitForTimeout(100);
  await shot("04-home");
  // Sell the eagle
  await p.click("#menuBtn"); await p.click("#menu [data-go=coins]");
  await shot("05-coins");
  await p.click(".coin-row:has-text('Silver Eagle')");
  const ebay = await p.getAttribute("a:has-text('Check eBay sold')", "href");
  console.log("ebay", ebay);
  await p.click("[data-act=sell]");
  await p.fill("#sellForm [name=amount]", "60"); await p.fill("#sellForm [name=shipping]", "5");
  await p.click("#sellForm button[type=submit]");
  await p.waitForTimeout(100);
  await p.click("[data-go=home] >> nth=0"); await shot("06-home-sold");
  // Delete + undo
  await p.click("#menuBtn"); await p.click("#menu [data-go=coins]");
  await p.click(".coin-row:has-text('1944')");
  await p.click("[data-act=delete]");
  await shot("07-deleted-toast");
  await p.click("#toast button");
  const n = await p.$$eval(".coin-row", (r) => r.length);
  console.log("rows after undo", n);
  // filter chip
  await p.click(".chip:has-text('Morgan dollar')");
  console.log("morgan rows", await p.$$eval(".coin-row", (r) => r.length));
  await p.selectOption("[data-list=sort]", "value"); await p.click("[data-act=dir]");
  await shot("08-coins-filtered");
  // album
  await p.click("#menuBtn"); await p.click("#menu [data-go=albums]");
  await shot("09-albums");
  await p.click(".card[data-go^=album-]");
  await shot("10-album");
  await p.click("[data-act=missing]"); await shot("11-missing"); await p.click(".x");
  // new custom album
  await p.click("#menuBtn"); await p.click("#menu [data-go=albums]");
  await p.click("[data-act=newAlbum]");
  await p.selectOption("#albumTypes select >> nth=0", "franklin-half");
  await p.click("#albumForm button[type=submit]"); await p.waitForTimeout(200);
  console.log("franklin slots", await p.$$eval(".slot", (r) => r.length));
  await p.click("#menuBtn"); await p.click("#menu [data-go=value]"); await shot("12-value");
  await p.click("#menuBtn"); await p.click("#menu [data-go=guide]"); await shot("13-guide");
  await p.click("#menuBtn"); await p.click("#menu [data-go=options]"); await shot("14-options");
  // edit flow: label auto & edit
  console.log("csv", (await p.evaluate(() => toCsv())).split("\n").slice(0, 3).join("\n"));
  console.log("errors", errors);
  await b.close();
})();
