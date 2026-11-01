const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.click("#menuBtn");
  console.log("menu:", await p.$$eval("#menu button", (x) => x.map((b) => b.textContent)));
  await p.click("#menu [data-go=wants]");
  console.log("empty:", (await p.textContent(".card.empty")).trim());
  // add by hand
  await p.click("[data-act=wantNew]");
  await p.selectOption("#wantForm [name=typeId]", "morgan-dollar"); await p.fill("#wantForm [name=year]", "1893"); await p.selectOption("#wantForm [name=mint]", "CC");
  await p.selectOption("#wantForm [name=grade]", "VF-20"); await p.fill("#wantForm [name=maxPrice]", "900"); await p.fill("#wantForm [name=notes]", "original surfaces");
  await p.click("#wantForm button[type=submit]"); await p.waitForTimeout(200);
  console.log("row:", (await p.textContent(".coin-row")).replace(/\s+/g, " ").trim());
  console.log("eBay:", await p.getAttribute(".coin-row a", "href"));
  // edit
  await p.click("[data-act=wantEdit]"); await p.fill("#wantForm [name=maxPrice]", "1100"); await p.click("#wantForm button[type=submit]"); await p.waitForTimeout(200);
  console.log("after edit:", (await p.textContent(".coin-row .coin-sub")).trim(), "| count:", await p.$$eval(".coin-row", (x) => x.length));
  // from an album
  await p.evaluate(() => { const a = { kind: "album", id: "alb1", brand: "Whitman", number: "9128", name: "", typeId: "peace-dollar", start: 1921, end: 1935, removed: [], createdAt: 1 }; a.slots = buildSlots("peace-dollar", 1921, 1935); put("a_alb1", a); });
  await p.evaluate(() => go("album-alb1")); await p.waitForTimeout(200);
  await p.click("[data-act=missing]");
  await p.click("[data-missck] >> nth=0"); await p.click("[data-act=missAdd]"); await p.waitForTimeout(150);
  console.log("one added via checkbox:", await p.evaluate(() => wants().length));
  await p.click("[data-act=missing]"); await p.click("[data-act=missAll]"); await p.click("[data-act=missAdd]"); await p.waitForTimeout(300);
  console.log("wants total:", await p.evaluate(() => wants().length), "(1 Morgan + 24 Peace)");
  await p.evaluate(() => go("wants")); await p.waitForTimeout(200);
  console.log("summary:", (await p.textContent("main .small.muted")).trim());
  await p.screenshot({ path: "/tmp/wants.png" });
  // Got it → form prefilled → saving removes the want
  const morganId = await p.evaluate(() => wants().find((w) => w.typeId === "morgan-dollar").id);
  await p.click(`[data-act=wantGot][data-id="${morganId}"]`); await p.waitForTimeout(200);
  console.log("prefill:", JSON.stringify(await p.evaluate(() => ({ t: draft.typeId, y: draft.year, m: draft.mint, g: draft.grade, hint: document.querySelector("#bookHint").textContent }))));
  await p.fill("[data-f=paid]", "850"); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(300);
  console.log("coin added:", await p.textContent("h1"), "| want gone:", await p.evaluate((id) => !getWant(id), morganId));
  // Got it for an album want keeps the album
  const peace = await p.evaluate(() => wants().find((w) => w.year === 1922 && w.mint === "S").id);
  await p.evaluate(() => go("wants")); await p.waitForTimeout(150);
  await p.click(`[data-act=wantGot][data-id="${peace}"]`); await p.waitForTimeout(200);
  console.log("album kept:", await p.evaluate(() => draft.albumId));
  await p.click("[data-act=closeSheet] >> nth=0");
  console.log("cancel keeps want:", await p.evaluate((id) => !!getWant(id), peace));
  // remove + undo
  await p.click(`[data-act=wantRemove][data-id="${peace}"]`); await p.waitForTimeout(100);
  console.log("removed:", await p.evaluate((id) => !getWant(id), peace)); await p.click("#toast button"); await p.waitForTimeout(100);
  console.log("undo:", await p.evaluate((id) => !!getWant(id), peace));
  console.log("errors", errors); await b.close();
})();
