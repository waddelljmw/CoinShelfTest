const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => {
    const a = { kind: "album", id: "m1", brand: "Whitman", number: "9128", name: "", typeId: "morgan-dollar", start: 1878, end: 1921, removed: [], createdAt: 1 };
    a.slots = buildSlots("morgan-dollar", 1878, 1921); a.slots.unshift({ y: 1878, m: "", v: "8 Tail Feathers", custom: true }); put("a_m1", a); go("album-m1");
  });
  await p.waitForTimeout(200);
  await p.click(".slot:has-text('8 Tail Feathers')");
  console.log("menu buttons:", await p.$$eval(".sheet button, .sheet a.btn", (x) => x.map((e) => e.textContent.trim()).filter((t) => t && t !== "✕")));
  const add = await p.locator(".btn-addcoin").boundingBox(), want = await p.locator(".btn-want").boundingBox();
  console.log("Add coin above want:", add.y < want.y, "| gap px:", Math.round(want.y - (add.y + add.height)));
  await p.screenshot({ path: "/tmp/spotadd-menu.png" });
  await p.click(".btn-addcoin"); await p.waitForTimeout(200);
  const sh = await p.locator(".sheet").boundingBox();
  console.log("form height share:", (sh.height / 844).toFixed(2), "| title:", await p.textContent(".sheet-head h2"), "| still on:", await p.evaluate(() => location.hash));
  console.log("prefill:", JSON.stringify(await p.evaluate(() => ({ t: draft.typeId, y: draft.year, m: draft.mint, v: draft.variety, album: draft.albumId, metal: draft.metal, label: autoLabel(draft) }))));
  await p.screenshot({ path: "/tmp/spotadd-form.png" });
  await p.selectOption("[data-f=grade]", "VF-20"); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(300);
  console.log("after save on:", await p.evaluate(() => location.hash), "| toast:", await p.textContent("#toast"), "| sheet closed:", await p.evaluate(() => document.getElementById("sheet").hidden));
  console.log("spot filled:", (await p.textContent(".slot:has-text('8 Tail Feathers')")).replace(/\s+/g, " ").trim(), "| owned:", (await p.textContent(".stat:has-text('Owned') .v")).trim());
  console.log("saved coin has no working fields:", await p.evaluate(() => allCoins().every((c) => !("_stay" in c) && !("_short" in c))));
  // owned spot menu has no Add coin
  await p.click(".slot:has-text('8 Tail Feathers')");
  console.log("owned menu has Add coin:", await p.isVisible(".btn-addcoin"), "| View coin:", await p.isVisible(".sheet [data-go^=coin-]"));
  // the + button still opens the full form and goes to the coin page
  await p.click("[data-act=closeSheet] >> nth=0"); await p.click("#fab");
  console.log("normal add form full height:", !(await p.evaluate(() => document.querySelector(".sheet").classList.contains("sheet-75"))));
  console.log("errors", errors); await b.close();
})();
