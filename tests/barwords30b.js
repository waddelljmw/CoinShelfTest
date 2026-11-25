// Step 30b: the Add form and Save button name what's being added.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.addInitScript(() => { window.KEEP_CHOOSER = true; });
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const words = async () => [await p.textContent("#sheet .sheet-head h2"), await p.textContent("#coinForm button[type=submit]")].join("|");
  await p.click("#fab"); await p.click("[data-act=what][data-v=bullion]");
  ok("bar", (await words()) === "Add bar|Save bar");
  await p.selectOption("[data-f=bShape]", "Round");
  ok("updates to round", (await words()) === "Add round|Save round");
  await p.selectOption("[data-f=bShape]", "Junk");
  ok("junk silver", (await words()) === "Add junk silver|Save junk silver");
  for (const [v, w] of [["roll", "Add roll|Save roll"], ["set", "Add set|Save set"], ["us", "Add coin|Add coin"]]) {
    await p.evaluate(() => closeSheet()); await p.click("#fab"); await p.click(`[data-act=what][data-v=${v}]`);
    ok(v, (await words()) === w);
  }
  ok("no page errors", !errors.length);
  await b.close();
})();
