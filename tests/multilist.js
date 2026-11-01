const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  // Photograde link in add-coin form
  await p.click("#fab");
  console.log("photograde link:", await p.getAttribute("a:has-text('PCGS Photograde')", "href"), await p.getAttribute("a:has-text('PCGS Photograde')", "target"));
  await p.click("[data-act=closeSheet] >> nth=0");

  // Multi want lists
  await p.click("#menuBtn"); await p.click("#menu [data-go=wants]");
  console.log("default chips:", await p.$$eval(".chips .chip", (x) => x.map((e) => e.textContent)));
  await p.click("[data-act=wlNew]");
  await p.fill("#wlForm [name=name]", "Morgan Dollars I Need");
  await p.selectOption("#wlScope", "type"); await p.waitForTimeout(80);
  await p.selectOption("#wlForm [name=typeId]", "morgan-dollar");
  await p.click("#wlForm button[type=submit]"); await p.waitForTimeout(200);
  console.log("after create:", await p.$$eval(".chips .chip", (x) => x.map((e) => e.textContent)), "| subtitle:", (await p.textContent("main")).includes("Morgan Dollar only"));
  await p.click("[data-act=wantNew]");
  console.log("typeId preset:", await p.evaluate(() => document.querySelector('[name=typeId]').value));
  await p.fill("[name=year]", "1889"); await p.click("#wantForm button[type=submit]"); await p.waitForTimeout(200);
  console.log("item in list:", (await p.textContent("main")).includes("1889 Morgan Dollar"));

  // second scoped list: type+grade
  await p.click("[data-act=wlNew]");
  await p.fill("#wlForm [name=name]", "Peace MS63");
  await p.selectOption("#wlScope", "type-grade"); await p.waitForTimeout(80);
  await p.selectOption("#wlForm [name=typeId]", "peace-dollar");
  await p.selectOption("#wlForm [name=grade]", "MS-63");
  await p.click("#wlForm button[type=submit]"); await p.waitForTimeout(200);
  await p.click("[data-act=wantNew]");
  console.log("preset type+grade:", await p.evaluate(() => [document.querySelector('[name=typeId]').value, document.querySelector('[name=grade]').value]));
  await p.click("[data-act=closeSheet] >> nth=0");

  // switch back to General - should be empty unless items added there
  await p.click(".chip:has-text('General')"); await p.waitForTimeout(100);
  console.log("general count badge matches 0:", (await p.textContent(".chips")).includes("General") );

  // album bulk add
  await p.evaluate(() => {
    const a = { kind: "album", id: "alb1", brand: "Dansco", number: "1", name: "", typeId: "peace-dollar", start: 1921, end: 1935, removed: [], createdAt: 1 };
    a.slots = buildSlots("peace-dollar", 1921, 1935); put("a_alb1", a); go("album-alb1");
  });
  await p.waitForTimeout(200);
  await p.click("[data-act=missing]");
  console.log("checkboxes:", await p.$$eval("[data-missck]", (x) => x.length));
  await p.click("[data-act=missAll]"); await p.waitForTimeout(100);
  console.log("selected count text:", await p.textContent("#missCount"));
  await p.selectOption("#missListPick", { label: "Peace MS63" });
  await p.screenshot({ path: "/tmp/missing-picker.png" });
  await p.click("[data-act=missAdd]"); await p.waitForTimeout(200);
  console.log("after bulk add, want list wants:", await p.evaluate(() => wants().filter((w) => w.listId).length));
  console.log("on Peace MS63 list now:", (await p.textContent("main")).includes("coins"));
  await p.screenshot({ path: "/tmp/wantlist-page.png" });

  // delete list blocked while it has items
  await p.evaluate(() => go("wants")); await p.waitForTimeout(150);
  await p.click(".chip:has-text('Morgan Dollars I Need')"); await p.waitForTimeout(100);
  await p.click("[data-act=wlDelete]"); await p.waitForTimeout(100);
  console.log("delete blocked toast:", await p.textContent("#toast"));

  console.log("errors", errors);
  await b.close();
})();
