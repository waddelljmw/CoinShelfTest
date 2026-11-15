// Item 70: "Add missing to a want list" asks which list and adds every missing coin in one tap.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  await p.evaluate(() => { put("a_T", { kind: "album", id: "T", brand: "Other", number: "", name: "Test", typeId: "morgan-dollar", typeIds: ["morgan-dollar"], layout: "dates", start: 1878, end: 1880, slots: [{ y: 1878, m: "" }, { y: 1879, m: "" }, { y: 1880, m: "" }, { y: 1881, m: "" }], removed: [], createdAt: 1 }); });
  const total = await p.evaluate(() => { const a = getAlbum("T"), st = albumStats(a); return st.slots.length - st.owned; });
  ok("album has missing coins", total > 3);
  // the button on the album page opens the quick sheet, not the pick-one-by-one window
  await p.evaluate(() => { go("album-T"); }); await p.waitForTimeout(200);
  await p.click("[data-act=missingQuick]"); await p.waitForTimeout(200);
  ok("quick sheet opens with a list button", await p.locator("[data-act=missQuickAdd]").count() > 0);
  ok("quick sheet has no checkboxes", await p.locator("[data-missck]").count() === 0);
  await p.locator("[data-act=missQuickAdd]").first().click(); await p.waitForTimeout(200);
  const n1 = await p.evaluate(() => wants().filter((w) => w.albumId === "T").length);
  ok("all missing coins added in one tap (" + n1 + ")", n1 === total);
  // doing it again adds nothing new (already on the list)
  await p.evaluate(() => openMissingQuick("T")); await p.locator("[data-act=missQuickAdd].primary").first().click(); await p.waitForTimeout(200);
  ok("second time skips coins already on the list", await p.evaluate(() => wants().filter((w) => w.albumId === "T").length) === n1);
  // Show missing still opens the checkbox picker
  await p.evaluate(() => openMissing("T")); await p.waitForTimeout(200);
  ok("Show missing still works", await p.locator(".sheet-head h2:has-text('Missing (')").count() > 0);
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
