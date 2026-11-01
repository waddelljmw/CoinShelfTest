// Step 2.3: the Add coin page asks "What is it?" first, shows only the basics, and keeps the rest in closed sections.
const { chromium } = require("playwright"); // real behaviour, so not the _compat helper
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);

  await p.click("#fab");
  ok("asks What is it? first", await p.isVisible(".what-btn[data-v=us]") && await p.isVisible(".what-btn[data-v=other]"));
  ok("no form fields yet", !(await p.isVisible("[data-f=year]")));
  await p.click(".what-btn[data-v=us]");
  ok("US coin: type search, year, mint, grade shown", await p.isVisible("#typeSearch") && await p.isVisible("[data-f=year]") && await p.isVisible("[data-f=mint]") && await p.isVisible("[data-f=grade]"));
  ok("page one hides the extras", !(await p.isVisible("[data-f=qty]")) && !(await p.isVisible("[data-f=paid]")) && !(await p.isVisible("[data-f=holder]")) && !(await p.isVisible("[data-f=notes]")));
  const secs = await p.$$eval("#coinForm details[data-sec]", (ds) => ds.map((d) => d.dataset.sec + ":" + d.open));
  ok("all sections closed on a new coin", secs.length >= 7 && secs.every((s) => s.endsWith(":false")));

  await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.fill("[data-f=year]", "1921");
  // a section you open stays open when the form redraws (e.g. after choosing a holder)
  await p.click("summary:has-text('Holder and album')"); await p.waitForTimeout(80);
  await p.selectOption("[data-f=holder]", "Flip"); await p.waitForTimeout(150);
  ok("opened section stays open after redraw", await p.isVisible("[data-f=holder]"));
  ok("section title shows the holder", (await p.textContent("summary:has-text('Holder and album')")).includes("Flip"));
  await p.click("summary:has-text('Purchase details')"); await p.fill("[data-f=paid]", "35");
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(250);
  const c = await p.evaluate(() => allCoins().find((x) => x.year == 1921 && x.status !== "deleted"));
  ok("saved with section values", c && c.holder === "Flip" && c.paid == 35 && c.typeId);
  ok("no working keys saved", c && c._what === undefined && c._open === undefined);

  // editing a coin that has purchase data opens that section
  await p.evaluate((id) => openCoinForm(id), c.id); await p.waitForTimeout(150);
  const e = await p.$$eval("#coinForm details[data-sec]", (ds) => Object.fromEntries(ds.map((d) => [d.dataset.sec, d.open])));
  ok("edit opens sections that have data", e.purchase === true && e.holder === true && e.errors === false);
  ok("edit has no What is it? step", !(await p.isVisible(".what-btn")));
  await p.click("button[data-act=closeSheet] >> nth=0");

  // medal, token or foreign coin
  await p.click("#fab"); await p.click(".what-btn[data-v=other]");
  ok("other: name and face value asked, no type search", await p.isVisible("[data-f=typeName]") && await p.isVisible("[data-f=denom]") && !(await p.isVisible("#typeSearch")));
  await p.fill("[data-f=typeName]", "Casino token"); await p.fill("[data-f=denom]", "$1");
  await p.click("summary:has-text('Quantity, value and metal')");
  await p.selectOption("[data-f=metal]", "Silver"); await p.fill("[data-f=oz]", "0.7"); await p.waitForTimeout(100);
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(250);
  const t = await p.evaluate(() => allCoins().find((x) => x.typeName === "Casino token" && x.status !== "deleted"));
  ok("token saved with metal weight", t && t.metal === "Silver" && t.oz === "0.7" && !t.typeId);

  // "Can't find it?" link from the US path
  await p.click("#fab"); await p.click(".what-btn[data-v=us]"); await p.click("button[data-act=what][data-v=other]");
  ok("Can't find it? switches to typing it yourself", await p.isVisible("[data-f=typeName]"));
  await p.screenshot({ path: "/tmp/step23-other.png" });
  await p.click("button[data-act=closeSheet] >> nth=0");
  await p.click("#fab"); await p.click(".what-btn[data-v=us]"); await p.screenshot({ path: "/tmp/step23-us.png" });
  console.log("errors", JSON.stringify(errors));
  await b.close();
})();
