const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);

  // From the Add-to-want-list form
  await p.click("#menuBtn"); await p.click("#menu [data-go=wants]");
  await p.click("[data-act=wantNew]");
  await p.selectOption("[name=typeId]", "morgan-dollar");
  await p.fill("[name=year]", "1884"); await p.selectOption("[name=mint]", "CC");
  await p.fill("[name=grade]", "").catch(() => {});
  await p.selectOption("[name=grade]", "AU-50");
  await p.fill("[name=maxPrice]", "500");
  await p.selectOption("#wantListPick", "__new");
  console.log("new-list form opened:", await p.isVisible("#wlForm"));
  await p.fill("#wlForm [name=name]", "CC Morgans");
  await p.click("#wlForm button[type=submit]"); await p.waitForTimeout(200);
  console.log("returned to want form:", await p.isVisible("#wantForm"), "| title:", await p.textContent(".sheet-head h2"));
  console.log("restored fields:", JSON.stringify(await p.evaluate(() => ({
    typeId: document.querySelector("[name=typeId]").value, year: document.querySelector("[name=year]").value,
    mint: document.querySelector("[name=mint]").value, grade: document.querySelector("[name=grade]").value,
    maxPrice: document.querySelector("[name=maxPrice]").value, listId: document.querySelector("#wantListPick").value,
  }))));
  await p.click("#wantForm button[type=submit]"); await p.waitForTimeout(200);
  console.log("item saved to new list:", (await p.textContent("main")).includes("CC Morgans"), "|", (await p.textContent("main")).includes("1884-CC"));
  await p.screenshot({ path: "/tmp/newlist-want.png" });

  // From the missing-picker
  await p.evaluate(() => {
    const a = { kind: "album", id: "alb1", brand: "Dansco", number: "1", name: "", typeId: "peace-dollar", start: 1921, end: 1935, removed: [], createdAt: 1 };
    a.slots = buildSlots("peace-dollar", 1921, 1935); put("a_alb1", a); go("album-alb1");
  });
  await p.waitForTimeout(200);
  await p.click("[data-act=missing]");
  await p.click("[data-missck] >> nth=0");
  await p.selectOption("#missListPick", "__new");
  await p.fill("#wlForm [name=name]", "Peace Keepers");
  await p.click("#wlForm button[type=submit]"); await p.waitForTimeout(200);
  console.log("returned to missing picker:", await p.isVisible("#missListPick"), "| preselected:", await p.evaluate(() => document.querySelector("#missListPick").value));
  const sel = await p.evaluate(() => { const o = [...document.querySelectorAll("#missListPick option")].find((x) => x.selected); return o.textContent; });
  console.log("selected list label:", sel);
  await p.click("[data-act=missAdd]"); await p.waitForTimeout(200);
  console.log("toast:", await p.textContent("#toast"));

  // Fresh "+ New list" from chips doesn't resurrect a stale want form
  await p.evaluate(() => go("wants")); await p.waitForTimeout(150);
  await p.click("[data-act=wlNew]");
  await p.fill("#wlForm [name=name]", "Plain List");
  await p.click("#wlForm button[type=submit]"); await p.waitForTimeout(200);
  console.log("no stray want form after plain list create:", !(await p.isVisible("#wantForm")));
  console.log("errors", errors);
  await b.close();
})();
